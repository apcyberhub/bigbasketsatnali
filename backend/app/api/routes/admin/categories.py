import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.audit_log import AdminAuditLog
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTreeResponse
from app.schemas.common import APIResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/categories", tags=["Admin Categories"])


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _log_audit(db: Session, admin_id: int, action: str, entity_id: str, details: str, request: Request = None):
    ip = request.client.host if request and request.client else None
    audit = AdminAuditLog(
        admin_user_id=admin_id,
        action=action,
        entity_type="category",
        entity_id=str(entity_id),
        details=details,
        ip_address=ip
    )
    db.add(audit)


@router.get("", response_model=APIResponse[List[CategoryResponse]])
def get_admin_categories(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    categories = (
        db.query(Category)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[CategoryResponse.model_validate(c) for c in categories]
    )


@router.get("/tree", response_model=APIResponse[List[CategoryTreeResponse]])
def get_admin_category_tree(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    parent_categories = (
        db.query(Category)
        .filter(Category.parent_id == None)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[CategoryTreeResponse.model_validate(c) for c in parent_categories]
    )


@router.get("/{category_id}", response_model=APIResponse[CategoryResponse])
def get_admin_category_by_id(
    category_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found."}
        )
    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category)
    )


@router.post("", response_model=APIResponse[CategoryResponse], status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    base_slug = cat_in.slug or _slugify(cat_in.name)
    slug = base_slug
    counter = 1
    while db.query(Category).filter(Category.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    cat_data = cat_in.model_dump(exclude={"slug"})
    category = Category(
        **cat_data,
        slug=slug
    )
    db.add(category)
    db.flush()

    _log_audit(db, admin_user.id, "category_created", str(category.id), f"Created category '{category.name}'", request)
    db.commit()
    db.refresh(category)

    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category)
    )


@router.put("/{category_id}", response_model=APIResponse[CategoryResponse])
def update_category(
    category_id: int,
    cat_in: CategoryUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found."}
        )

    # Check slug uniqueness if updating slug
    if cat_in.slug and cat_in.slug != category.slug:
        exists = db.query(Category).filter(Category.slug == cat_in.slug, Category.id != category_id).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DUPLICATE_SLUG", "message": f"Category slug '{cat_in.slug}' already exists."}
            )

    update_data = cat_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(category, field, val)

    _log_audit(db, admin_user.id, "category_updated", str(category.id), f"Updated category '{category.name}'", request)
    db.commit()
    db.refresh(category)

    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category)
    )


@router.delete("/{category_id}", response_model=APIResponse[dict])
def delete_category(
    category_id: int,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found."}
        )

    # Check if category has products
    prod_count = db.query(Product).filter(Product.category_id == category_id).count()
    if prod_count > 0:
        # Soft-delete instead of hard error
        category.is_active = False
        _log_audit(db, admin_user.id, "category_disabled", str(category.id), f"Deactivated category '{category.name}' containing {prod_count} products", request)
        db.commit()
        return APIResponse(
            success=True,
            data={"message": f"Category '{category.name}' contains {prod_count} products and has been deactivated."}
        )

    category.is_active = False
    _log_audit(db, admin_user.id, "category_disabled", str(category.id), f"Deactivated category '{category.name}'", request)
    db.commit()

    return APIResponse(
        success=True,
        data={"message": f"Category '{category.name}' has been deactivated."}
    )


@router.patch("/{category_id}/restore", response_model=APIResponse[CategoryResponse])
def restore_category(
    category_id: int,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found."}
        )

    category.is_active = True
    _log_audit(db, admin_user.id, "category_restored", str(category.id), f"Restored category '{category.name}'", request)
    db.commit()
    db.refresh(category)

    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category)
    )
