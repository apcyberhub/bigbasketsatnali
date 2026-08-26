import os
import re
import math
import shutil
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product, ProductImage
from app.models.category import Category
from app.models.audit_log import AdminAuditLog
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.schemas.common import APIResponse, PaginationMeta
from app.api.deps import require_admin

router = APIRouter(prefix="/products", tags=["Admin Products"])


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _log_audit(db: Session, admin_id: int, action: str, entity_id: str, details: str, request: Request = None):
    ip = request.client.host if request and request.client else None
    audit = AdminAuditLog(
        admin_user_id=admin_id,
        action=action,
        entity_type="product",
        entity_id=str(entity_id),
        details=details,
        ip_address=ip
    )
    db.add(audit)


@router.get("", response_model=APIResponse[ProductListResponse])
def get_admin_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query("all", description="all, active, inactive, low_stock"),
    sort: Optional[str] = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all products with search, status filters, and pagination for admin view.
    """
    query = db.query(Product)

    # Status filter
    if status_filter == "active":
        query = query.filter(Product.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(Product.is_active == False)
    elif status_filter == "low_stock":
        query = query.filter(Product.is_active == True, Product.stock_quantity <= Product.low_stock_threshold)

    # Category filter
    if category_id:
        query = query.filter(Product.category_id == category_id)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.sku.ilike(term),
                Product.brand.ilike(term),
                Product.tags.ilike(term)
            )
        )

    # Sorting
    if sort == "price-low":
        query = query.order_by(Product.price.asc())
    elif sort == "price-high":
        query = query.order_by(Product.price.desc())
    elif sort == "stock-low":
        query = query.order_by(Product.stock_quantity.asc())
    elif sort == "name":
        query = query.order_by(Product.name.asc())
    else:  # newest
        query = query.order_by(Product.id.desc())

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return APIResponse(
        success=True,
        data=ProductListResponse(
            items=[ProductResponse.model_validate(p) for p in items],
            pagination=PaginationMeta(
                total_count=total_count,
                page=page,
                limit=limit,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1
            )
        )
    )


@router.get("/{product_id}", response_model=APIResponse[ProductResponse])
def get_admin_product(
    product_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product not found."}
        )
    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.post("", response_model=APIResponse[ProductResponse], status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new product with automatic slug and discount calculation.
    """
    # 1. Check SKU uniqueness
    existing_sku = db.query(Product).filter(Product.sku == prod_in.sku.strip()).first()
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_SKU", "message": f"A product with SKU '{prod_in.sku}' already exists."}
        )

    # 2. Check Category
    category = db.query(Category).filter(Category.id == prod_in.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CATEGORY", "message": "Selected category does not exist."}
        )

    # 3. Compute discount percentage
    discount_pct = 0
    if prod_in.mrp > Decimal("0.00"):
        discount_pct = int(round(((prod_in.mrp - prod_in.price) / prod_in.mrp) * 100))
        discount_pct = max(0, min(100, discount_pct))

    # 4. Generate unique slug
    base_slug = prod_in.slug or _slugify(f"{prod_in.name} {prod_in.weight or ''}")
    slug = base_slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    prod_data = prod_in.model_dump(exclude={"image_url", "slug"})
    product = Product(
        **prod_data,
        slug=slug,
        discount_percentage=discount_pct
    )
    db.add(product)
    db.flush()

    # Image
    if prod_in.image_url:
        img = ProductImage(
            product_id=product.id,
            image_url=prod_in.image_url,
            alt_text=product.name,
            sort_order=0
        )
        db.add(img)

    _log_audit(db, admin_user.id, "product_created", str(product.id), f"Created product '{product.name}' (SKU: {product.sku})", request)
    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.put("/{product_id}", response_model=APIResponse[ProductResponse])
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product not found."}
        )

    # Check SKU conflict
    if prod_in.sku and prod_in.sku.strip() != product.sku:
        existing_sku = db.query(Product).filter(Product.sku == prod_in.sku.strip(), Product.id != product_id).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DUPLICATE_SKU", "message": f"SKU '{prod_in.sku}' is in use by another product."}
            )

    update_data = prod_in.model_dump(exclude_unset=True, exclude={"image_url"})
    for field, val in update_data.items():
        setattr(product, field, val)

    # Recalculate discount
    if product.mrp > Decimal("0.00"):
        discount_pct = int(round(((product.mrp - product.price) / product.mrp) * 100))
        product.discount_percentage = max(0, min(100, discount_pct))

    # Update primary image
    if prod_in.image_url:
        first_img = db.query(ProductImage).filter(ProductImage.product_id == product.id).first()
        if first_img:
            first_img.image_url = prod_in.image_url
        else:
            db.add(ProductImage(product_id=product.id, image_url=prod_in.image_url, alt_text=product.name))

    _log_audit(db, admin_user.id, "product_updated", str(product.id), f"Updated product '{product.name}'", request)
    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.delete("/{product_id}", response_model=APIResponse[dict])
def soft_delete_product(
    product_id: int,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Soft-delete product by setting is_active = False.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product not found."}
        )

    product.is_active = False
    _log_audit(db, admin_user.id, "product_disabled", str(product.id), f"Soft-deleted product '{product.name}'", request)
    db.commit()

    return APIResponse(
        success=True,
        data={"message": f"Product '{product.name}' has been deactivated (soft-deleted)."}
    )


@router.patch("/{product_id}/restore", response_model=APIResponse[ProductResponse])
def restore_product(
    product_id: int,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Restore an inactive soft-deleted product (is_active = True).
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product not found."}
        )

    product.is_active = True
    _log_audit(db, admin_user.id, "product_restored", str(product.id), f"Restored product '{product.name}'", request)
    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.post("/upload-image", response_model=APIResponse[dict])
async def upload_product_image(
    file: UploadFile = File(...),
    admin_user: User = Depends(require_admin)
):
    """
    Validates and stores an uploaded product image file locally.
    Enforces format (.jpg, .jpeg, .png, .webp) and max 5MB size limit.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    filename = file.filename or "product.png"
    _, ext = os.path.splitext(filename.lower())

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE_TYPE", "message": "Only JPG, PNG, and WEBP images are allowed."}
        )

    # Read and validate file size (Max 5MB)
    contents = await file.read()
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FILE_TOO_LARGE", "message": "Image size exceeds maximum allowed limit of 5MB."}
        )

    # Save directory in root assets/uploads
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
    upload_dir = os.path.join(root_dir, "assets", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    import uuid
    safe_filename = f"prod_{int(datetime.now(timezone.utc).timestamp())}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return APIResponse(
        success=True,
        data={
            "image_url": f"assets/uploads/{safe_filename}",
            "filename": safe_filename,
            "size": len(contents)
        }
    )

