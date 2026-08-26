from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.payment import Payment
from app.models.order import Order
from app.schemas.payment import RefundCreateRequest, RefundResponse
from app.services import payment as payment_service

router = APIRouter(prefix="/payments", tags=["Admin Payments"])


@router.get("")
def list_admin_payments(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    List all payment records with filters for status and search terms.
    """
    query = db.query(Payment).join(Order, Payment.order_id == Order.id)

    if status_filter:
        query = query.filter(Payment.status == status_filter)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Payment.provider_payment_id.ilike(search_term)) |
            (Payment.provider_order_id.ilike(search_term)) |
            (Order.order_number.ilike(search_term))
        )

    total_count = query.count()
    payments = (
        query.order_by(Payment.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for p in payments:
        refunded_amount = sum(
            Decimal(str(r.amount)) for r in p.refunds if r.status == "processed"
        )
        items.append({
            "id": p.id,
            "order_id": p.order_id,
            "order_number": p.order.order_number if p.order else f"#{p.order_id}",
            "customer_name": p.user.full_name if p.user else "Customer",
            "customer_email": p.user.email if p.user else "",
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "method": p.method or "Online",
            "provider": p.provider,
            "provider_payment_id": p.provider_payment_id,
            "provider_order_id": p.provider_order_id,
            "signature_verified": p.signature_verified,
            "refunded_amount": refunded_amount,
            "refundable_amount": max(Decimal("0.00"), p.amount - refunded_amount),
            "created_at": p.created_at.isoformat() if p.created_at else None
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
    }


@router.get("/{payment_id}")
def get_admin_payment_detail(
    payment_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Get detailed payment record including refund history and associated order information.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    refunded_amount = sum(
        Decimal(str(r.amount)) for r in payment.refunds if r.status == "processed"
    )

    refunds_data = []
    for r in payment.refunds:
        refunds_data.append({
            "id": r.id,
            "amount": r.amount,
            "status": r.status,
            "reason": r.reason,
            "provider_refund_id": r.provider_refund_id,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "success": True,
        "data": {
            "id": payment.id,
            "order_id": payment.order_id,
            "order_number": payment.order.order_number if payment.order else f"#{payment.order_id}",
            "customer_name": payment.user.full_name if payment.user else "Customer",
            "customer_email": payment.user.email if payment.user else "",
            "customer_phone": payment.user.phone if payment.user else "",
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
            "method": payment.method or "Online",
            "provider": payment.provider,
            "provider_payment_id": payment.provider_payment_id,
            "provider_order_id": payment.provider_order_id,
            "signature_verified": payment.signature_verified,
            "failure_reason": payment.failure_reason,
            "refunded_amount": refunded_amount,
            "refundable_amount": max(Decimal("0.00"), payment.amount - refunded_amount),
            "refunds": refunds_data,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else None
        }
    }


@router.post("/{payment_id}/refund")
def admin_refund_payment(
    payment_id: int,
    payload: RefundCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Initiate a full or partial refund for a captured payment via Razorpay.
    """
    refund = payment_service.process_admin_refund(
        payment_id=payment_id,
        amount=payload.amount,
        reason=payload.reason or "Admin initiated refund",
        admin_user_id=admin.id,
        db=db
    )
    return {
        "success": True,
        "message": "Refund processed successfully",
        "data": {
            "id": refund.id,
            "payment_id": refund.payment_id,
            "order_id": refund.order_id,
            "provider_refund_id": refund.provider_refund_id,
            "amount": refund.amount,
            "status": refund.status,
            "reason": refund.reason,
            "created_at": refund.created_at.isoformat() if refund.created_at else None
        }
    }
