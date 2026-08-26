import hmac
import hashlib
import json
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.payment_event import PaymentEvent
from app.models.refund import Refund


@pytest.fixture
def test_order_fixtures(db_session, client, auth_headers):
    """
    Creates an internal test order for testing payment flows.
    """
    user = db_session.query(User).filter(User.email == "test.customer@example.com").first()

    order = Order(
        order_number="BB-TEST-PAY-001",
        user_id=user.id,
        address_id=1,
        status="pending",
        payment_status="pending",
        payment_method="Online Payment (Razorpay)",
        subtotal=Decimal("450.00"),
        discount=Decimal("50.00"),
        delivery_fee=Decimal("30.00"),
        total_amount=Decimal("430.00"),
        estimated_delivery="15–30 mins"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    return {"order": order, "user": user}


def test_create_payment_order(client: TestClient, auth_headers, test_order_fixtures):
    """Test 1: Valid Razorpay payment order creation with amount in paise (430.00 -> 43000)."""
    order = test_order_fixtures["order"]

    res = client.post(
        "/api/payments/create-order",
        headers=auth_headers,
        json={"order_id": order.id}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["order_id"] == order.id
    assert data["order_number"] == order.order_number
    assert data["amount"] == 43000  # 430 INR = 43000 paise
    assert data["currency"] == "INR"
    assert "razorpay_order_id" in data
    assert data["razorpay_order_id"].startswith("order_")


def test_unauthorized_payment_creation(client: TestClient, test_order_fixtures):
    """Test 2: Unauthorized (guest) payment creation is rejected with 401."""
    order = test_order_fixtures["order"]
    res = client.post(
        "/api/payments/create-order",
        json={"order_id": order.id}
    )
    assert res.status_code == 401


def test_cross_user_payment_order(client: TestClient, test_order_fixtures):
    """Test 3: Customer cannot create payment for another customer's order."""
    order = test_order_fixtures["order"]

    # Register and login user 2
    client.post("/api/auth/register", json={
        "full_name": "Attacker User",
        "email": "attacker@example.com",
        "phone": "9111122222",
        "password": "password123"
    })
    login_res = client.post("/api/auth/login", json={
        "identifier": "attacker@example.com",
        "password": "password123"
    })
    user2_token = login_res.json()["data"]["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    res = client.post(
        "/api/payments/create-order",
        headers=user2_headers,
        json={"order_id": order.id}
    )
    assert res.status_code == 403


def test_server_side_amount_validation(client: TestClient, auth_headers, test_order_fixtures, db_session):
    """Test 4: Backend derives payment amount strictly from DB, ignoring client amount tamper attempts."""
    order = test_order_fixtures["order"]

    # Client tries to pass a fake amount in create-order payload (ignored by schema)
    res = client.post(
        "/api/payments/create-order",
        headers=auth_headers,
        json={"order_id": order.id, "amount": 100}
    )
    assert res.status_code == 200
    assert res.json()["data"]["amount"] == 43000  # Strictly ₹430.00 from DB


def test_valid_signature_verification_and_success_state(client: TestClient, auth_headers, test_order_fixtures, db_session):
    """Test 5 & 7: Successful cryptographic HMAC SHA256 signature verification marks payment captured and order paid."""
    order = test_order_fixtures["order"]

    # 1. Create payment order
    create_res = client.post(
        "/api/payments/create-order",
        headers=auth_headers,
        json={"order_id": order.id}
    )
    rzp_order_id = create_res.json()["data"]["razorpay_order_id"]
    rzp_payment_id = "pay_test_succ_123456"

    # 2. Compute authentic signature using secret key
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    payload = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    # 3. Verify
    verify_res = client.post(
        "/api/payments/verify",
        headers=auth_headers,
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()["data"]
    assert v_data["status"] == "captured"

    # 4. Verify in DB
    db_session.refresh(order)
    assert order.payment_status == "paid"
    assert order.status == "confirmed"

    payment = db_session.query(Payment).filter(Payment.provider_order_id == rzp_order_id).first()
    assert payment.status == "captured"
    assert payment.signature_verified is True


def test_invalid_signature_rejection_and_failure_handling(client: TestClient, auth_headers, test_order_fixtures, db_session):
    """Test 6 & 8: Tampered signature is rejected with 400 and recorded as failed."""
    order = test_order_fixtures["order"]

    create_res = client.post(
        "/api/payments/create-order",
        headers=auth_headers,
        json={"order_id": order.id}
    )
    rzp_order_id = create_res.json()["data"]["razorpay_order_id"]
    rzp_payment_id = "pay_test_fail_998877"
    fake_sig = "fake_tampered_signature_hex_1234567890abcdef"

    res = client.post(
        "/api/payments/verify",
        headers=auth_headers,
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": fake_sig
        }
    )
    assert res.status_code == 400

    # Order remains unpaid
    db_session.refresh(order)
    assert order.payment_status != "paid"

    payment = db_session.query(Payment).filter(Payment.provider_order_id == rzp_order_id).first()
    assert payment.status == "failed"
    assert payment.signature_verified is False


def test_idempotent_duplicate_verification(client: TestClient, auth_headers, test_order_fixtures):
    """Test 9: Repeating the exact same verification callback is idempotent."""
    order = test_order_fixtures["order"]

    create_res = client.post("/api/payments/create-order", headers=auth_headers, json={"order_id": order.id})
    rzp_order_id = create_res.json()["data"]["razorpay_order_id"]
    rzp_payment_id = "pay_test_idem_001"

    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    payload = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    # First call
    res1 = client.post("/api/payments/verify", headers=auth_headers, json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_sig
    })
    assert res1.status_code == 200

    # Duplicate call
    res2 = client.post("/api/payments/verify", headers=auth_headers, json={
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": valid_sig
    })
    assert res2.status_code == 200
    assert res2.json()["data"]["status"] == "captured"


def test_webhook_signature_and_idempotency(client: TestClient, db_session):
    """Test 10 & 17: Webhook signature verification and duplicate event prevention."""
    event_payload = {
        "entity": "event",
        "event": "payment.captured",
        "id": "evt_test_webhook_12345",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_captured_99",
                    "order_id": "order_webhook_test_88",
                    "amount": 43000,
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi"
                }
            }
        }
    }
    raw_body = json.dumps(event_payload).encode("utf-8")
    webhook_secret = (settings.RAZORPAY_WEBHOOK_SECRET or "").encode("utf-8")
    valid_webhook_sig = hmac.new(webhook_secret, raw_body, hashlib.sha256).hexdigest()

    # 1. Invalid signature
    res_bad = client.post(
        "/api/payments/webhook",
        content=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "wrong_sig"}
    )
    assert res_bad.status_code == 400

    # 2. Valid signature
    res_good = client.post(
        "/api/payments/webhook",
        content=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_webhook_sig}
    )
    assert res_good.status_code == 200
    assert res_good.json()["status"] == "success"

    # 3. Duplicate Webhook (Idempotency)
    res_dup = client.post(
        "/api/payments/webhook",
        content=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_webhook_sig}
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "already_processed"


def test_retry_payment_flow(client: TestClient, auth_headers, test_order_fixtures):
    """Test 11: Retry failed/pending payment generates a fresh payment order."""
    order = test_order_fixtures["order"]

    retry_res = client.post(
        "/api/payments/retry",
        headers=auth_headers,
        json={"order_id": order.id}
    )
    assert retry_res.status_code == 200
    assert retry_res.json()["data"]["order_id"] == order.id
    assert "razorpay_order_id" in retry_res.json()["data"]


def test_cod_flow_separation(client: TestClient, auth_headers, db_session):
    """Test 12: Cash on Delivery does not create Razorpay payment records."""
    # Place COD order
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 1}, headers=auth_headers)
    res = client.post(
        "/api/orders",
        headers=auth_headers,
        json={"address_id": 1, "payment_method": "Cash on Delivery"}
    )
    assert res.status_code == 201
    order_id = res.json()["data"]["id"]

    # Verify no payment record created
    payments = db_session.query(Payment).filter(Payment.order_id == order_id).all()
    assert len(payments) == 0


def test_admin_refund_validation_full_and_partial(client: TestClient, admin_auth_headers, db_session):
    """Test 13, 14, 15: Admin refund amount validation, partial refund, and full refund."""
    # Create captured payment
    user = db_session.query(User).first()
    order = Order(
        order_number="BB-REFUND-001",
        user_id=user.id,
        address_id=1,
        status="delivered",
        payment_status="paid",
        payment_method="Online Payment (Razorpay)",
        subtotal=Decimal("500.00"),
        discount=Decimal("0.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("500.00"),
        estimated_delivery="15–30 mins"
    )
    db_session.add(order)
    db_session.flush()

    payment = Payment(
        order_id=order.id,
        user_id=user.id,
        provider="razorpay",
        provider_order_id="order_ref_123",
        provider_payment_id="pay_ref_123",
        amount=Decimal("500.00"),
        status="captured",
        signature_verified=True
    )
    db_session.add(payment)
    db_session.commit()

    # 1. Reject refund greater than total amount
    res_exceed = client.post(
        f"/api/admin/payments/{payment.id}/refund",
        headers=admin_auth_headers,
        json={"amount": 600.00, "reason": "Too much"}
    )
    assert res_exceed.status_code == 400

    # 2. Partial refund (200 out of 500)
    res_partial = client.post(
        f"/api/admin/payments/{payment.id}/refund",
        headers=admin_auth_headers,
        json={"amount": 200.00, "reason": "1 item damaged"}
    )
    assert res_partial.status_code == 200
    assert float(res_partial.json()["data"]["amount"]) == 200.0

    db_session.refresh(payment)
    assert payment.status == "partially_refunded"

    # 3. Full refund of remaining balance (300)
    res_full = client.post(
        f"/api/admin/payments/{payment.id}/refund",
        headers=admin_auth_headers,
        json={"reason": "Customer cancellation"}
    )
    assert res_full.status_code == 200
    assert float(res_full.json()["data"]["amount"]) == 300.0

    db_session.refresh(payment)
    assert payment.status == "refunded"
    assert payment.order.payment_status == "refunded"


def test_customer_payment_history(client: TestClient, auth_headers, test_order_fixtures, db_session):
    """Test 16: Customer can retrieve their own payment history."""
    order = test_order_fixtures["order"]
    payment = Payment(
        order_id=order.id,
        user_id=order.user_id,
        provider="razorpay",
        provider_order_id="order_hist_99",
        provider_payment_id="pay_hist_99",
        amount=Decimal("430.00"),
        status="captured",
        signature_verified=True
    )
    db_session.add(payment)
    db_session.commit()

    res = client.get("/api/payments/history", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 1
    assert data[0]["provider_payment_id"] == "pay_hist_99"
