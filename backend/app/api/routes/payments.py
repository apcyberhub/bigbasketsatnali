from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, Request, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.schemas.payment import (
    CreatePaymentOrderRequest,
    CreatePaymentOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    RetryPaymentRequest,
    PaymentResponse,
)
from app.services import payment as payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create-order")
def create_payment_order(
    payload: CreatePaymentOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a Razorpay payment order for an existing internal customer order.
    Amount is loaded strictly from the database (zero-trust).
    """
    order_data = payment_service.create_razorpay_order_for_internal_order(
        order_id=payload.order_id,
        user_id=current_user.id,
        db=db
    )
    return {
        "success": True,
        "data": order_data
    }


@router.post("/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifies the cryptographic Razorpay HMAC SHA256 payment signature.
    Marks the payment as captured and the order as paid.
    """
    payment, order = payment_service.verify_razorpay_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
        db=db
    )
    return {
        "success": True,
        "message": "Payment verified successfully",
        "data": {
            "payment_id": payment.provider_payment_id or str(payment.id),
            "order_id": order.id,
            "order_number": order.order_number,
            "status": payment.status,
            "amount": payment.amount,
            "currency": payment.currency,
            "method": payment.method
        }
    }


@router.post("/retry")
def retry_payment(
    payload: RetryPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a fresh payment session for an existing unpaid or failed order.
    """
    order_data = payment_service.retry_payment(
        order_id=payload.order_id,
        user_id=current_user.id,
        db=db
    )
    return {
        "success": True,
        "message": "Payment retry initiated",
        "data": order_data
    }


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature")
):
    """
    Razorpay Webhook receiver. Validates HMAC signature and processes events idempotently.
    """
    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header"
        )

    raw_body = await request.body()
    try:
        event_payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

    result = payment_service.process_razorpay_webhook(
        event_payload=event_payload,
        signature_header=x_razorpay_signature,
        raw_body=raw_body,
        db=db
    )
    return result


@router.get("/history")
def get_customer_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the authenticated customer's payment transaction history.
    """
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    history_data = []
    for p in payments:
        history_data.append({
            "id": p.id,
            "order_id": p.order_id,
            "order_number": p.order.order_number if p.order else f"#{p.order_id}",
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "method": p.method or "Online",
            "provider_payment_id": p.provider_payment_id,
            "provider_order_id": p.provider_order_id,
            "signature_verified": p.signature_verified,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return {
        "success": True,
        "data": history_data
    }
