from decimal import Decimal
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient

from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.address import Address
from app.models.cart import Cart, CartItem
from app.models.delivery_zone import DeliveryZone
from app.models.coupon import Coupon
from app.models.order import Order


import uuid

@pytest.fixture
def checkout_fixtures(db_session, auth_headers):
    """
    Setup test fixtures: products, delivery zone, and coupons.
    """
    cat = db_session.query(Category).first()
    cat_id = cat.id if cat else 1

    unique_id = uuid.uuid4().hex[:6]

    # 1. Product (Price 250, stock 10)
    p1 = Product(
        name=f"Amul Butter 500g {unique_id}",
        slug=f"amul-butter-500g-{unique_id}",
        sku=f"SKU-BUTTER-{unique_id}",
        brand="Amul",
        category_id=cat_id,
        price=Decimal("250.00"),
        mrp=Decimal("275.00"),
        stock_quantity=10,
        is_active=True
    )
    p2 = Product(
        name=f"Tata Salt 1kg {unique_id}",
        slug=f"tata-salt-1kg-{unique_id}",
        sku=f"SKU-SALT-{unique_id}",
        brand="Tata",
        category_id=cat_id,
        price=Decimal("30.00"),
        mrp=Decimal("35.00"),
        stock_quantity=5,
        is_active=True
    )
    db_session.add_all([p1, p2])
    db_session.flush()

    # 2. Coupons (check if already exist or add)
    coupon_valid = db_session.query(Coupon).filter(Coupon.code == "SAVE20").first()
    if not coupon_valid:
        coupon_valid = Coupon(
            code="SAVE20",
            description="20% off above 200",
            discount_type="percentage",
            discount_value=Decimal("20.00"),
            minimum_order=Decimal("200.00"),
            maximum_discount=Decimal("60.00"),
            usage_limit=10,
            per_user_limit=1,
            is_active=True
        )
        db_session.add(coupon_valid)

        coupon_expired = Coupon(
            code="EXPIRED10",
            description="Expired coupon",
            discount_type="fixed",
            discount_value=Decimal("10.00"),
            minimum_order=Decimal("50.00"),
            start_date=datetime.now(timezone.utc) - timedelta(days=10),
            end_date=datetime.now(timezone.utc) - timedelta(days=1),
            usage_limit=10,
            per_user_limit=1,
            is_active=True
        )
        db_session.add(coupon_expired)

    db_session.commit()

    return {
        "p1": p1,
        "p2": p2,
        "coupon_valid": coupon_valid,
        "coupon_expired": coupon_expired
    }


def test_delivery_check_valid_pincode(client: TestClient):
    """Test 1: Delivery zone check with valid pincode."""
    res = client.get("/api/delivery/check?pincode=123024")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["available"] is True
    assert "Satnali" in body["data"]["zone"]
    assert float(body["data"]["delivery_fee"]) == 30.0


def test_delivery_check_unavailable_pincode(client: TestClient):
    """Test 2: Delivery zone check with unsupported pincode."""
    res = client.get("/api/delivery/check?pincode=999999")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["available"] is False


def test_minimum_order_validation(client: TestClient, auth_headers, checkout_fixtures, db_session):
    """Test 3: Minimum order requirement rejected if subtotal < zone minimum order."""
    zone = db_session.query(DeliveryZone).first()
    zone.minimum_order = Decimal("100.00")
    db_session.commit()

    p2 = checkout_fixtures["p2"] # Price is 30, min order is 100
    # Add 1 unit of p2 to cart
    client.post("/api/cart/items", json={"product_id": p2.id, "quantity": 1}, headers=auth_headers)

    res = client.post(
        "/api/orders",
        headers=auth_headers,
        json={"address_id": 1, "payment_method": "Cash on Delivery"}
    )
    assert res.status_code == 400
    assert "minimum order" in res.json()["error"]["message"].lower() or "add" in res.json()["error"]["message"].lower()


def test_delivery_fee_and_free_threshold_pricing(client: TestClient, auth_headers, checkout_fixtures, db_session):
    """Test 4 & 5: Server calculates fee when < 500 and free delivery when >= 500."""
    p1 = checkout_fixtures["p1"] # Price 250

    # Add 1 unit -> subtotal 250 < 499 free threshold -> delivery fee 30
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 1}, headers=auth_headers)

    res = client.post(
        "/api/checkout/summary",
        headers=auth_headers,
        json={"address_id": 1}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert float(data["subtotal"]) == 250.0
    assert float(data["delivery_fee"]) == 30.0
    assert float(data["total_amount"]) == 280.0
    assert data["is_free_delivery"] is False

    # Add another unit -> subtotal 500 >= 499 -> free delivery (fee 0)
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 1}, headers=auth_headers)

    res2 = client.post(
        "/api/checkout/summary",
        headers=auth_headers,
        json={"address_id": 1}
    )
    assert res2.status_code == 200
    data2 = res2.json()["data"]
    assert float(data2["subtotal"]) == 500.0
    assert float(data2["delivery_fee"]) == 0.0
    assert float(data2["total_amount"]) == 500.0
    assert data2["is_free_delivery"] is True


def test_coupon_valid_and_invalid_and_expired(client: TestClient, auth_headers, checkout_fixtures):
    """Test 6, 7, 8: Valid coupon discount, invalid code, and expired code."""
    p1 = checkout_fixtures["p1"]
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 1}, headers=auth_headers) # Subtotal 250

    # Valid SAVE20: 20% of 250 = 50 discount
    res_valid = client.post(
        "/api/checkout/apply-coupon",
        headers=auth_headers,
        json={"coupon_code": "SAVE20"}
    )
    assert res_valid.status_code == 200
    assert float(res_valid.json()["data"]["discount_amount"]) == 50.0

    # Invalid code
    res_invalid = client.post(
        "/api/checkout/apply-coupon",
        headers=auth_headers,
        json={"coupon_code": "NOTEXIST"}
    )
    assert res_invalid.status_code == 400

    # Expired code
    res_expired = client.post(
        "/api/checkout/apply-coupon",
        headers=auth_headers,
        json={"coupon_code": "EXPIRED10"}
    )
    assert res_expired.status_code == 400


def test_insufficient_stock_rejection(client: TestClient, auth_headers, checkout_fixtures, db_session):
    """Test 11: Insufficient stock rejects order cleanly."""
    p1 = checkout_fixtures["p1"] # stock 10
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 5}, headers=auth_headers)

    # Manually drop stock to 2 in db
    p1.stock_quantity = 2
    db_session.commit()

    res = client.post(
        "/api/orders",
        headers=auth_headers,
        json={"address_id": 1, "payment_method": "Cash on Delivery"}
    )
    assert res.status_code == 400
    assert "available" in res.json()["error"]["message"].lower() or "stock" in res.json()["error"]["message"].lower()


def test_successful_atomic_cod_order_and_idempotency(client: TestClient, auth_headers, checkout_fixtures, db_session):
    """Test 12 & 13 & 18: Successful COD order placement, stock reduction, cart clear, and duplicate prevention."""
    p1 = checkout_fixtures["p1"]
    initial_stock = p1.stock_quantity # 10

    # Order 2 units (Price 250 x 2 = 500, Coupon SAVE20: 20% capped at 60 -> Total = 500 - 60 + 0 = 440)
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 2}, headers=auth_headers)

    idem_key = "IDEM_TEST_KEY_9988"

    res = client.post(
        "/api/orders",
        headers={
            **auth_headers,
            "Idempotency-Key": idem_key
        },
        json={
            "address_id": 1,
            "payment_method": "Cash on Delivery",
            "coupon_code": "SAVE20"
        }
    )
    assert res.status_code == 201
    order_data = res.json()["data"]
    order_id = order_data["id"]
    order_number = order_data["order_number"]

    assert order_number.startswith("BB")
    assert float(order_data["subtotal"]) == 500.0
    assert float(order_data["discount"]) == 60.0 # Capped at 60
    assert float(order_data["total_amount"]) == 440.0

    # Verify Stock Reduced in DB
    db_session.refresh(p1)
    assert p1.stock_quantity == initial_stock - 2

    # Verify Cart Cleared
    cart_res = client.get("/api/cart", headers=auth_headers)
    assert len(cart_res.json()["data"]["items"]) == 0

    # Test Idempotency: Repeating exact request returns existing order without double deduction
    res_duplicate = client.post(
        "/api/orders",
        headers={
            **auth_headers,
            "Idempotency-Key": idem_key
        },
        json={
            "address_id": 1,
            "payment_method": "Cash on Delivery",
            "coupon_code": "SAVE20"
        }
    )
    assert res_duplicate.status_code == 201 or res_duplicate.status_code == 200
    assert res_duplicate.json()["data"]["id"] == order_id
    db_session.refresh(p1)
    assert p1.stock_quantity == initial_stock - 2 # Not deducted again!


def test_order_cancellation_and_restock(client: TestClient, auth_headers, checkout_fixtures, db_session):
    """Test 14 & 18: Customer can cancel pending order, and items are restocked."""
    p1 = checkout_fixtures["p1"]
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 3}, headers=auth_headers)

    # Create order
    res = client.post(
        "/api/orders",
        headers=auth_headers,
        json={"address_id": 1, "payment_method": "Cash on Delivery"}
    )
    assert res.status_code == 201
    order_id = res.json()["data"]["id"]
    db_session.refresh(p1)
    stock_after_order = p1.stock_quantity

    # Cancel order
    res_cancel = client.post(
        f"/api/orders/{order_id}/cancel",
        headers=auth_headers
    )
    assert res_cancel.status_code == 200
    assert res_cancel.json()["data"]["status"] == "cancelled"

    # Verify restocked
    db_session.refresh(p1)
    assert p1.stock_quantity == stock_after_order + 3


def test_unauthorized_order_and_cross_user_rejection(client: TestClient, auth_headers, checkout_fixtures, db_session):
    """Test 15 & 16: Unauthorized guest cannot create orders, customer cannot access another user's order."""
    # Guest user creating order fails
    res_guest = client.post("/api/orders", json={"address_id": 1})
    assert res_guest.status_code == 401

    # Create order as test customer
    p1 = checkout_fixtures["p1"]
    client.post("/api/cart/items", json={"product_id": p1.id, "quantity": 1}, headers=auth_headers)
    res_create = client.post(
        "/api/orders",
        headers=auth_headers,
        json={"address_id": 1}
    )
    order_id = res_create.json()["data"]["id"]

    # Register and login a second customer
    client.post("/api/auth/register", json={
        "full_name": "Second User",
        "email": "second.user@example.com",
        "phone": "9777788888",
        "password": "password123"
    })
    res_login2 = client.post("/api/auth/login", json={
        "identifier": "second.user@example.com",
        "password": "password123"
    })
    token2 = res_login2.json()["data"]["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Second user trying to access first user's order
    res_other = client.get(f"/api/orders/{order_id}", headers=headers2)
    assert res_other.status_code == 404
