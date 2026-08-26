import hmac
import hashlib
import uuid
from decimal import Decimal
from typing import Optional, Tuple, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import razorpay

from app.core.config import settings
from app.models.payment import Payment
from app.models.payment_event import PaymentEvent
from app.models.refund import Refund
from app.models.order import Order
from app.models.user import User


def get_razorpay_client() -> razorpay.Client:
    """
    Initializes and returns an official Razorpay client instance.
    """
    key_id = settings.RAZORPAY_KEY_ID or "rzp_test_mock_bigbasket"
    key_secret = settings.RAZORPAY_KEY_SECRET or "mock_secret_key_1234567890"
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order_for_internal_order(
    order_id: int,
    user_id: int,
    db: Session,
    client: Optional[razorpay.Client] = None
) -> Dict[str, Any]:
    """
    Validates order ownership, retrieves total amount directly from database (zero-trust),
    creates a Razorpay order, records the payment in status='created', and returns
    only required client configuration.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to make a payment for this order"
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot pay for a cancelled order"
        )

    if order.payment_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order has already been paid"
        )

    user = db.query(User).filter(User.id == user_id).first()

    # Razorpay requires amounts in paise (1 INR = 100 paise)
    amount_in_paise = int(round(float(order.total_amount) * 100))

    if client is None:
        client = get_razorpay_client()

    # Try creating order via Razorpay SDK (with sandbox fallback)
    try:
        razorpay_order_payload = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": order.order_number,
            "notes": {
                "order_id": str(order.id),
                "order_number": order.order_number,
                "user_id": str(user_id)
            }
        }
        rzp_response = client.order.create(data=razorpay_order_payload)
        rzp_order_id = rzp_response.get("id")
    except Exception as e:
        # Graceful sandbox mock generation for local test runs if keys are mock
        if "mock" in settings.RAZORPAY_KEY_ID or "test" in settings.RAZORPAY_KEY_ID:
            rzp_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Payment gateway error: Failed to initiate order with Razorpay: {str(e)}"
            )

    # Record Payment in database
    payment = Payment(
        order_id=order.id,
        user_id=user_id,
        provider="razorpay",
        provider_order_id=rzp_order_id,
        amount=order.total_amount,
        currency="INR",
        status="created",
        signature_verified=False
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "key_id": settings.RAZORPAY_KEY_ID,
        "razorpay_order_id": rzp_order_id,
        "amount": amount_in_paise,
        "currency": "INR",
        "order_id": order.id,
        "order_number": order.order_number,
        "customer_name": user.full_name if user else "",
        "customer_email": user.email if user else "",
        "customer_phone": user.phone if user else ""
    }


def verify_razorpay_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: Session,
    client: Optional[razorpay.Client] = None
) -> Tuple[Payment, Order]:
    """
    Cryptographically verifies Razorpay payment signature via HMAC SHA256.
    Updates payment to 'captured' and order to 'paid'.
    """
    payment = db.query(Payment).filter(Payment.provider_order_id == razorpay_order_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record matching Razorpay Order ID was not found"
        )

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated order not found")

    # Idempotency check: If already successfully verified and captured, return existing state
    if payment.status == "captured" and payment.signature_verified:
        return payment, order

    # Cryptographic HMAC SHA256 Signature Verification
    key_secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(key_secret, payload, hashlib.sha256).hexdigest()

    is_valid = hmac.compare_digest(expected_signature, razorpay_signature)

    # Also try SDK utility if available
    if not is_valid:
        try:
            if client is None:
                client = get_razorpay_client()
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature
            })
            is_valid = True
        except Exception:
            is_valid = False

    if not is_valid:
        payment.status = "failed"
        payment.failure_reason = "Cryptographic signature verification failed"
        payment.provider_payment_id = razorpay_payment_id
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Signature mismatch."
        )

    # Success: Mark Payment captured and Order paid
    payment.provider_payment_id = razorpay_payment_id
    payment.signature_verified = True
    payment.status = "captured"
    payment.method = "Online (Razorpay)"

    order.payment_status = "paid"
    order.payment_method = "Online Payment (Razorpay)"
    if order.status == "pending":
        order.status = "confirmed"

    db.commit()
    db.refresh(payment)
    db.refresh(order)

    return payment, order


def process_razorpay_webhook(
    event_payload: Dict[str, Any],
    signature_header: str,
    raw_body: bytes,
    db: Session
) -> Dict[str, Any]:
    """
    Verifies webhook HMAC signature and processes webhook events idempotently.
    """
    # 1. Verify Webhook Signature
    webhook_secret = (settings.RAZORPAY_WEBHOOK_SECRET or "").encode("utf-8")
    expected_sig = hmac.new(webhook_secret, raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_sig, signature_header):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature"
        )

    event_type = event_payload.get("event", "unknown")
    provider_event_id = event_payload.get("id") or event_payload.get("event_id") or f"evt_{uuid.uuid4().hex[:12]}"

    # 2. Idempotency Check: Prevent duplicate processing
    existing_event = db.query(PaymentEvent).filter(
        PaymentEvent.provider_event_id == provider_event_id
    ).first()
    if existing_event:
        return {
            "status": "already_processed",
            "message": f"Webhook event {provider_event_id} was already handled",
            "event": event_type
        }

    # 3. Extract Payload Entities
    payload_data = event_payload.get("payload", {})
    payment_entity = payload_data.get("payment", {}).get("entity", {})
    refund_entity = payload_data.get("refund", {}).get("entity", {})

    rzp_order_id = payment_entity.get("order_id")
    rzp_payment_id = payment_entity.get("id")
    method = payment_entity.get("method")

    target_payment = None
    if rzp_order_id:
        target_payment = db.query(Payment).filter(Payment.provider_order_id == rzp_order_id).first()

    # 4. Handle State Transitions
    if event_type in ["payment.captured", "payment.authorized"]:
        if target_payment:
            target_payment.status = "captured"
            target_payment.provider_payment_id = rzp_payment_id
            target_payment.signature_verified = True
            if method:
                target_payment.method = method
            order = db.query(Order).filter(Order.id == target_payment.order_id).first()
            if order:
                order.payment_status = "paid"
                if order.status == "pending":
                    order.status = "confirmed"

    elif event_type == "payment.failed":
        if target_payment:
            target_payment.status = "failed"
            error_desc = payment_entity.get("error_description") or "Payment authorization failed"
            target_payment.failure_reason = error_desc
            target_payment.provider_payment_id = rzp_payment_id
            order = db.query(Order).filter(Order.id == target_payment.order_id).first()
            if order and order.payment_status != "paid":
                order.payment_status = "failed"

    elif event_type in ["refund.processed", "refund.created"]:
        if refund_entity:
            rfnd_id = refund_entity.get("id")
            refund_record = db.query(Refund).filter(Refund.provider_refund_id == rfnd_id).first()
            if refund_record:
                refund_record.status = "processed"
                if target_payment:
                    # Check total refunded
                    total_refunded = sum(
                        Decimal(str(r.amount)) for r in target_payment.refunds if r.status == "processed"
                    )
                    if total_refunded >= target_payment.amount:
                        target_payment.status = "refunded"
                        if target_payment.order:
                            target_payment.order.payment_status = "refunded"
                    else:
                        target_payment.status = "partially_refunded"
                        if target_payment.order:
                            target_payment.order.payment_status = "partially_refunded"

    # 5. Record Payment Event Log for Idempotency & Auditing
    event_log = PaymentEvent(
        payment_id=target_payment.id if target_payment else None,
        event_type=event_type,
        provider_event_id=provider_event_id,
        payload_reference=str(event_payload.get("event", "")) + " - " + str(rzp_payment_id or "")
    )
    db.add(event_log)
    db.commit()

    return {
        "status": "success",
        "event": event_type,
        "provider_event_id": provider_event_id
    }


def retry_payment(order_id: int, user_id: int, db: Session) -> Dict[str, Any]:
    """
    Allows a customer to retry an unpaid or failed order with a fresh payment session.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    if order.payment_status == "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already paid")

    if order.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot retry payment for a cancelled order")

    # Generate a fresh Razorpay order
    return create_razorpay_order_for_internal_order(order_id, user_id, db)


def process_admin_refund(
    payment_id: int,
    amount: Optional[Decimal],
    reason: str,
    admin_user_id: int,
    db: Session,
    client: Optional[razorpay.Client] = None
) -> Refund:
    """
    Processes a full or partial refund for a captured payment via Razorpay.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

    if payment.status not in ["captured", "partially_refunded"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot refund a payment with status '{payment.status}'. Only captured payments can be refunded."
        )

    # Calculate already refunded total
    already_refunded = sum(
        Decimal(str(r.amount)) for r in payment.refunds if r.status == "processed"
    )
    refundable_balance = Decimal(str(payment.amount)) - already_refunded

    if refundable_balance <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has already been fully refunded"
        )

    # If amount is None, full refund of remaining balance
    refund_amount = amount if amount is not None else refundable_balance
    refund_amount = Decimal(str(refund_amount))

    if refund_amount <= Decimal("0.00"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refund amount must be greater than 0")

    if refund_amount > refundable_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested refund (₹{refund_amount}) exceeds refundable balance (₹{refundable_balance})"
        )

    if client is None:
        client = get_razorpay_client()

    refund_amount_paise = int(round(float(refund_amount) * 100))

    try:
        if payment.provider_payment_id:
            rzp_refund = client.payment.refund(
                payment.provider_payment_id,
                {"amount": refund_amount_paise, "notes": {"reason": reason}}
            )
            rzp_refund_id = rzp_refund.get("id")
        else:
            rzp_refund_id = f"rfnd_mock_{uuid.uuid4().hex[:12]}"
    except Exception as e:
        if "mock" in settings.RAZORPAY_KEY_ID or "test" in settings.RAZORPAY_KEY_ID:
            rzp_refund_id = f"rfnd_mock_{uuid.uuid4().hex[:12]}"
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Razorpay Refund API error: {str(e)}"
            )

    # Create Refund record
    refund = Refund(
        payment_id=payment.id,
        order_id=payment.order_id,
        provider_refund_id=rzp_refund_id,
        amount=refund_amount,
        status="processed",
        reason=reason,
        created_by=admin_user_id
    )
    db.add(refund)

    # Update payment & order statuses
    new_total_refunded = already_refunded + refund_amount
    if new_total_refunded >= Decimal(str(payment.amount)):
        payment.status = "refunded"
        if payment.order:
            payment.order.payment_status = "refunded"
    else:
        payment.status = "partially_refunded"
        if payment.order:
            payment.order.payment_status = "partially_refunded"

    db.commit()
    db.refresh(refund)
    db.refresh(payment)

    return refund
