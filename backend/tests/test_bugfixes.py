import io
import os
import hmac
import hashlib
import pytest
from fastapi import status
from decimal import Decimal

from app.core.config import settings
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.models.payment import Payment


def test_product_image_upload_and_static_serving(client, admin_auth_headers):
    """
    Test 1: Admin can upload JPG/PNG/WEBP image, size is validated, and file is served statically.
    """
    fake_img = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4")
    upload_res = client.post(
        "/api/admin/products/upload-image",
        files={"file": ("test_fresh_apple.png", fake_img, "image/png")},
        headers=admin_auth_headers
    )
    assert upload_res.status_code == status.HTTP_200_OK
    data = upload_res.json()["data"]
    assert "image_url" in data
    img_url = data["image_url"]
    assert img_url.startswith("assets/uploads/")

    # Check that StaticFiles correctly serves the uploaded file
    static_url = f"/{img_url}"
    static_res = client.get(static_url)
    assert static_res.status_code == status.HTTP_200_OK
    assert len(static_res.content) > 0


def test_product_image_upload_invalid_type_rejected(client, admin_auth_headers):
    """
    Test 2: Uploading executable or unsupported file (.exe, .txt, .sh) is rejected.
    """
    bad_file = io.BytesIO(b"echo 'malicious'")
    upload_res = client.post(
        "/api/admin/products/upload-image",
        files={"file": ("script.sh", bad_file, "application/x-sh")},
        headers=admin_auth_headers
    )
    assert upload_res.status_code == status.HTTP_400_BAD_REQUEST
    assert upload_res.json()["error"]["code"] == "INVALID_IMAGE_TYPE"


def test_product_image_upload_oversized_rejected(client, admin_auth_headers):
    """
    Test 3: Uploading an image larger than 5MB is rejected.
    """
    oversized = io.BytesIO(b"0" * (6 * 1024 * 1024))  # 6MB
    upload_res = client.post(
        "/api/admin/products/upload-image",
        files={"file": ("huge_photo.jpg", oversized, "image/jpeg")},
        headers=admin_auth_headers
    )
    assert upload_res.status_code == status.HTTP_400_BAD_REQUEST
    assert upload_res.json()["error"]["code"] == "FILE_TOO_LARGE"


def test_create_and_update_product_with_image(client, admin_auth_headers, db_session):
    """
    Test 4: Creating a product with an uploaded image attaches ProductImage record.
    """
    cat = db_session.query(Category).first()
    if not cat:
        cat = Category(name="Fresh Produce", slug="fresh-produce", icon="🥦", is_active=True)
        db_session.add(cat)
        db_session.commit()

    prod_payload = {
        "name": "Shimla Royal Apples",
        "sku": "SKU-APL-SHM-1KG",
        "brand": "Fresho",
        "category_id": cat.id,
        "subcategory_name": "Fresh Fruits",
        "price": "180.00",
        "mrp": "220.00",
        "stock_quantity": 40,
        "unit": "kg",
        "image_url": "assets/uploads/prod_test_apple.png"
    }

    create_res = client.post(
        "/api/admin/products",
        json=prod_payload,
        headers=admin_auth_headers
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    prod_data = create_res.json()["data"]
    assert len(prod_data["images"]) > 0
    assert prod_data["images"][0]["image_url"] == "assets/uploads/prod_test_apple.png"

    # Update product with new image
    update_res = client.put(
        f"/api/admin/products/{prod_data['id']}",
        json={"image_url": "assets/uploads/prod_test_apple_v2.png"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == status.HTTP_200_OK
    updated_data = update_res.json()["data"]
    assert updated_data["images"][0]["image_url"] == "assets/uploads/prod_test_apple_v2.png"


def test_order_status_progression_and_out_for_delivery(client, admin_auth_headers, db_session):
    """
    Test 5: Valid order status transitions flow:
    pending -> confirmed -> processing -> packed -> out_for_delivery -> delivered
    """
    user = db_session.query(User).filter(User.email == "test.customer@example.com").first()
    order = Order(
        order_number="BB-TEST-STAT-001",
        user_id=user.id,
        address_id=1,
        delivery_zone_id=1,
        subtotal=Decimal("250.00"),
        discount=Decimal("0.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("250.00"),
        status="pending",
        payment_status="pending",
        payment_method="Cash on Delivery"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    # 1. Pending -> Confirmed
    res1 = client.patch(
        f"/api/admin/orders/{order.id}/status",
        json={"status": "confirmed", "notes": "Order confirmed by store"},
        headers=admin_auth_headers
    )
    assert res1.status_code == status.HTTP_200_OK
    assert res1.json()["data"]["status"] == "confirmed"

    # 2. Confirmed -> Packed (operational shortcut supported)
    res2 = client.patch(
        f"/api/admin/orders/{order.id}/status",
        json={"status": "packed", "notes": "Packed in tote bag 4"},
        headers=admin_auth_headers
    )
    assert res2.status_code == status.HTTP_200_OK
    assert res2.json()["data"]["status"] == "packed"

    # 3. Packed -> Out for Delivery
    res3 = client.patch(
        f"/api/admin/orders/{order.id}/status",
        json={"status": "out_for_delivery", "notes": "Rider Rahul assigned"},
        headers=admin_auth_headers
    )
    assert res3.status_code == status.HTTP_200_OK
    assert res3.json()["data"]["status"] == "out_for_delivery"

    # 4. Out for Delivery -> Delivered
    res4 = client.patch(
        f"/api/admin/orders/{order.id}/status",
        json={"status": "delivered", "notes": "Delivered successfully"},
        headers=admin_auth_headers
    )
    assert res4.status_code == status.HTTP_200_OK
    assert res4.json()["data"]["status"] == "delivered"
    # COD order delivered should automatically mark payment paid
    assert res4.json()["data"]["payment_status"] == "paid"


def test_invalid_order_status_transition_rejected(client, admin_auth_headers, db_session):
    """
    Test 6: Invalid order status transition is rejected with 400.
    """
    user = db_session.query(User).filter(User.email == "test.customer@example.com").first()
    order = Order(
        order_number="BB-TEST-STAT-002",
        user_id=user.id,
        address_id=1,
        delivery_zone_id=1,
        subtotal=Decimal("199.00"),
        discount=Decimal("0.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("199.00"),
        status="delivered",
        payment_status="paid",
        payment_method="Online Payment (Razorpay)"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    # Attempt delivered -> processing
    res = client.patch(
        f"/api/admin/orders/{order.id}/status",
        json={"status": "processing"},
        headers=admin_auth_headers
    )
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


def test_online_upi_payment_flow(client, auth_headers, db_session):
    """
    Test 7: Full online payment flow:
    - Create order with payment_method='Online Payment (Razorpay)'
    - POST /api/payments/create-order -> returns razorpay_order_id & amount in paise
    - POST /api/payments/verify with valid HMAC SHA256 signature -> marks order paid & confirmed
    - Test invalid signature rejection
    """
    user = db_session.query(User).filter(User.email == "test.customer@example.com").first()
    order = Order(
        order_number="BB-TEST-PAY-001",
        user_id=user.id,
        address_id=1,
        delivery_zone_id=1,
        subtotal=Decimal("450.00"),
        discount=Decimal("0.00"),
        delivery_fee=Decimal("0.00"),
        total_amount=Decimal("450.00"),
        status="pending",
        payment_status="pending",
        payment_method="Online Payment (Razorpay)"
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    # 1. Create Razorpay Payment Order
    create_res = client.post(
        "/api/payments/create-order",
        json={"order_id": order.id},
        headers=auth_headers
    )
    assert create_res.status_code == status.HTTP_200_OK
    p_data = create_res.json()["data"]
    assert p_data["amount"] == 45000  # Rs 450.00 -> 45000 paise
    rzp_order_id = p_data["razorpay_order_id"]

    # 2. Test Invalid Signature rejection
    invalid_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": "pay_fake_999",
            "razorpay_signature": "invalid_signature_hash"
        },
        headers=auth_headers
    )
    assert invalid_res.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Test Valid HMAC SHA256 Signature Verification
    rzp_payment_id = "pay_test_upi_12345"
    key_secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    payload = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_sig = hmac.new(key_secret, payload, hashlib.sha256).hexdigest()

    verify_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": valid_sig
        },
        headers=auth_headers
    )
    assert verify_res.status_code == status.HTTP_200_OK
    assert verify_res.json()["success"] is True

    # 4. Check DB state
    db_session.refresh(order)
    assert order.payment_status == "paid"
    assert order.status == "confirmed"
