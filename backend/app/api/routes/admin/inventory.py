import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inventory import InventoryTransaction
from app.models.audit_log import AdminAuditLog
from app.schemas.inventory import InventoryUpdate, InventoryTransactionResponse
from app.schemas.product import ProductResponse, ProductListResponse
from app.schemas.common import APIResponse, PaginationMeta
from app.api.deps import require_admin

router = APIRouter(prefix="/inventory", tags=["Admin Inventory"])


@router.get("", response_model=APIResponse[ProductListResponse])
def get_inventory_list(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query("all", description="all, low_stock, out_of_stock, in_stock"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if status_filter == "low_stock":
        query = query.filter(Product.stock_quantity > 0, Product.stock_quantity <= Product.low_stock_threshold)
    elif status_filter == "out_of_stock":
        query = query.filter(Product.stock_quantity == 0)
    elif status_filter == "in_stock":
        query = query.filter(Product.stock_quantity > Product.low_stock_threshold)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.sku.ilike(term),
                Product.brand.ilike(term)
            )
        )

    query = query.order_by(Product.stock_quantity.asc())

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


@router.get("/low-stock", response_model=APIResponse[List[ProductResponse]])
def get_low_stock_products(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all active products with stock equal or below their low stock threshold.
    """
    low_stock = (
        db.query(Product)
        .filter(Product.is_active == True, Product.stock_quantity <= Product.low_stock_threshold)
        .order_by(Product.stock_quantity.asc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[ProductResponse.model_validate(p) for p in low_stock]
    )


@router.patch("/{product_id}", response_model=APIResponse[ProductResponse])
def update_product_stock(
    product_id: int,
    inv_in: InventoryUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Adjust or set product stock and create an immutable InventoryTransaction record.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product not found."}
        )

    prev_qty = product.stock_quantity

    if inv_in.new_quantity is not None:
        new_qty = inv_in.new_quantity
        change_qty = new_qty - prev_qty
    elif inv_in.change_quantity is not None:
        change_qty = inv_in.change_quantity
        new_qty = max(0, prev_qty + change_qty)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_INPUT", "message": "Provide either new_quantity or change_quantity."}
        )

    product.stock_quantity = new_qty

    # Create transaction log
    transaction = InventoryTransaction(
        product_id=product.id,
        admin_user_id=admin_user.id,
        change_quantity=change_qty,
        previous_quantity=prev_qty,
        new_quantity=new_qty,
        reason=inv_in.reason,
        notes=inv_in.notes
    )
    db.add(transaction)

    # Log audit
    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="stock_changed",
        entity_type="inventory",
        entity_id=str(product.id),
        details=f"Stock updated from {prev_qty} to {new_qty} ({change_qty:+d}) reason: {inv_in.reason}",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()
    db.refresh(product)

    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.get("/transactions", response_model=APIResponse[List[InventoryTransactionResponse]])
def get_inventory_transactions(
    product_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve stock adjustment transaction logs.
    """
    query = db.query(InventoryTransaction)
    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)

    records = query.order_by(InventoryTransaction.created_at.desc()).limit(limit).all()

    result = []
    for r in records:
        prod_name = r.product.name if r.product else f"Product #{r.product_id}"
        result.append(
            InventoryTransactionResponse(
                id=r.id,
                product_id=r.product_id,
                product_name=prod_name,
                admin_user_id=r.admin_user_id,
                change_quantity=r.change_quantity,
                previous_quantity=r.previous_quantity,
                new_quantity=r.new_quantity,
                reason=r.reason,
                notes=r.notes,
                created_at=r.created_at
            )
        )

    return APIResponse(
        success=True,
        data=result
    )
