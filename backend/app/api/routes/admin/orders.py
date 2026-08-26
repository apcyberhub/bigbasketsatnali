import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.audit_log import AdminAuditLog
from app.schemas.order import OrderResponse
from app.schemas.common import APIResponse, PaginationMeta
from app.api.deps import require_admin

router = APIRouter(prefix="/orders", tags=["Admin Orders"])


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|processing|packed|out_for_delivery|delivered|cancelled)$")
    notes: Optional[str] = Field(None, max_length=255)


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    pagination: PaginationMeta


VALID_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["processing", "packed", "cancelled"],
    "processing": ["packed", "out_for_delivery", "cancelled"],
    "packed": ["out_for_delivery", "delivered", "cancelled"],
    "out_for_delivery": ["delivered", "cancelled"],
    "delivered": [],  # Final state
    "cancelled": []   # Final state
}


@router.get("", response_model=APIResponse[OrderListResponse])
def get_admin_orders(
    status_filter: Optional[str] = Query("all"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if status_filter and status_filter != "all":
        query = query.filter(Order.status == status_filter.lower())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.join(User, Order.user_id == User.id).filter(
            or_(
                Order.order_number.ilike(term),
                User.full_name.ilike(term),
                User.phone.ilike(term),
                User.email.ilike(term)
            )
        )

    query = query.order_by(Order.created_at.desc())

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return APIResponse(
        success=True,
        data=OrderListResponse(
            items=[OrderResponse.model_validate(o) for o in items],
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


@router.get("/{order_id_or_number}", response_model=APIResponse[OrderResponse])
def get_admin_order(
    order_id_or_number: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if order_id_or_number.isdigit():
        order = db.query(Order).filter(Order.id == int(order_id_or_number)).first()
    else:
        order = db.query(Order).filter(Order.order_number.ilike(order_id_or_number)).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORDER_NOT_FOUND", "message": f"Order '{order_id_or_number}' not found."}
        )

    return APIResponse(
        success=True,
        data=OrderResponse.model_validate(order)
    )


@router.patch("/{order_id}/status", response_model=APIResponse[OrderResponse])
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORDER_NOT_FOUND", "message": "Order not found."}
        )

    current_status = order.status
    new_status = status_in.status.lower()

    if new_status == current_status:
        return APIResponse(success=True, data=OrderResponse.model_validate(order))

    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATUS_TRANSITION",
                "message": f"Cannot transition order status from '{current_status}' to '{new_status}'."
            }
        )

    order.status = new_status

    # If delivered on Cash on Delivery, mark payment as paid
    if new_status == "delivered" and order.payment_method and "cash" in order.payment_method.lower():
        order.payment_status = "paid"

    # Audit log
    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="order_status_changed",
        entity_type="order",
        entity_id=str(order.id),
        details=f"Status changed from '{current_status}' to '{new_status}'. Notes: {status_in.notes or 'None'}",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()
    db.refresh(order)

    return APIResponse(
        success=True,
        data=OrderResponse.model_validate(order)
    )
