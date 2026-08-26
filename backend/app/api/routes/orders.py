from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.common import ApiResponse
from app.schemas.checkout import OrderCancelResponse
from app.api.deps import get_current_user
from app.services.checkout import create_order_atomic, cancel_order_atomic

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=ApiResponse[List[OrderResponse]])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all orders placed by the current authenticated user.
    """
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return ApiResponse.ok(data=[OrderResponse.model_validate(o) for o in orders])


@router.get("/{order_id_or_number}", response_model=ApiResponse[OrderResponse])
def get_order_by_id_or_number(
    order_id_or_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single order by numeric ID or alphanumeric order number.
    Strictly validates ownership unless admin.
    """
    query = db.query(Order)
    if not current_user.is_admin:
        query = query.filter(Order.user_id == current_user.id)

    if order_id_or_number.isdigit():
        order = query.filter(Order.id == int(order_id_or_number)).first()
    else:
        order = query.filter(Order.order_number.ilike(order_id_or_number)).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORDER_NOT_FOUND", "message": f"Order '{order_id_or_number}' not found."}
        )

    return ApiResponse.ok(data=OrderResponse.model_validate(order))


@router.post("", response_model=ApiResponse[OrderResponse], status_code=status.HTTP_201_CREATED)
def create_customer_order(
    order_in: OrderCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atomically creates a new customer order from active cart items, validates delivery zone,
    applies coupon, calculates server-side totals, decrements stock, records coupon usage, and clears cart.
    Supports idempotency key via header or payload to prevent duplicate submissions.
    """
    idempotency_key = idempotency_key_header or order_in.idempotency_key

    order = create_order_atomic(
        user_id=current_user.id,
        address_id=order_in.address_id,
        payment_method=order_in.payment_method,
        coupon_code=order_in.coupon_code,
        idempotency_key=idempotency_key,
        db=db
    )

    return ApiResponse.ok(data=OrderResponse.model_validate(order))


@router.post("/{order_id}/cancel", response_model=ApiResponse[OrderCancelResponse])
def cancel_customer_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows customer to cancel order if it is in 'pending' or 'confirmed' status.
    Automatically restocks inventory products and updates order status to 'cancelled'.
    """
    order = cancel_order_atomic(order_id=order_id, user_id=current_user.id, db=db)

    return ApiResponse.ok(data=OrderCancelResponse(
        success=True,
        message=f"Order #{order.order_number} has been cancelled successfully and items have been restocked.",
        order_id=order.id,
        order_number=order.order_number,
        status=order.status
    ))
