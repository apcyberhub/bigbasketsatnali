import pytest
from decimal import Decimal
from app.core.security import hash_password
from app.models.user import User
from app.models.cart import Cart


@pytest.fixture
def admin_auth_headers(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin.test@example.com").first()
    if not admin:
        admin = User(
            full_name="Admin Test",
            email="admin.test@example.com",
            phone="9999999999",
            password_hash=hash_password("adminpass123"),
            is_active=True,
            is_verified=True,
            is_admin=True
        )
        db_session.add(admin)
        db_session.flush()
        db_session.add(Cart(user_id=admin.id))
        db_session.commit()

    response = client.post(
        "/api/auth/login",
        json={"identifier": "admin.test@example.com", "password": "adminpass123"}
    )
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_non_admin_forbidden(client, auth_headers):
    """
    Normal customer token accessing admin endpoint MUST be rejected with 403 Forbidden.
    """
    response = client.get("/api/admin/dashboard/stats", headers=auth_headers)
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "PERMISSION_DENIED"


def test_admin_dashboard_stats(client, admin_auth_headers):
    response = client.get("/api/admin/dashboard/stats", headers=admin_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    stats = data["data"]
    assert "orders_today" in stats
    assert "revenue_today" in stats
    assert "total_products" in stats
    assert "total_customers" in stats


def test_admin_product_crud_and_soft_delete(client, admin_auth_headers):
    # 1. Create product
    create_res = client.post(
        "/api/admin/products",
        json={
            "sku": "SKU-ADMIN-TEST-01",
            "name": "Admin Organic Apples",
            "brand": "Fresh Farm",
            "category_id": 1,
            "price": "120.00",
            "mrp": "150.00",
            "stock_quantity": 40,
            "unit": "kg",
            "emoji": "🍎",
            "is_active": True
        },
        headers=admin_auth_headers
    )
    assert create_res.status_code == 201
    prod = create_res.json()["data"]
    assert prod["discount_percentage"] == 20
    prod_id = prod["id"]

    # 2. Update product
    update_res = client.put(
        f"/api/admin/products/{prod_id}",
        json={"price": "100.00", "mrp": "150.00"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["discount_percentage"] == 33

    # 3. Soft delete product (is_active = False)
    del_res = client.delete(f"/api/admin/products/{prod_id}", headers=admin_auth_headers)
    assert del_res.status_code == 200

    check_res = client.get(f"/api/admin/products/{prod_id}", headers=admin_auth_headers)
    assert check_res.json()["data"]["is_active"] is False

    # 4. Restore product (is_active = True)
    restore_res = client.patch(f"/api/admin/products/{prod_id}/restore", headers=admin_auth_headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["data"]["is_active"] is True


def test_admin_category_crud(client, admin_auth_headers):
    # 1. Create category
    create_res = client.post(
        "/api/admin/categories",
        json={
            "name": "Exotic Fruits",
            "icon": "🥝",
            "discount_label": "Up to 30% OFF",
            "is_active": True
        },
        headers=admin_auth_headers
    )
    assert create_res.status_code == 201
    cat_id = create_res.json()["data"]["id"]

    # 2. Update category
    update_res = client.put(
        f"/api/admin/categories/{cat_id}",
        json={"name": "Exotic Fruits & Berries"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["name"] == "Exotic Fruits & Berries"

    # 3. Delete category
    del_res = client.delete(f"/api/admin/categories/{cat_id}", headers=admin_auth_headers)
    assert del_res.status_code == 200


def test_admin_inventory_adjustment_and_history(client, admin_auth_headers):
    # Adjust stock on Product ID: 1
    patch_res = client.patch(
        "/api/admin/inventory/1",
        json={"new_quantity": 85, "reason": "stock_added", "notes": "New delivery truck arrived"},
        headers=admin_auth_headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["stock_quantity"] == 85

    # Check transactions log
    tx_res = client.get("/api/admin/inventory/transactions?product_id=1", headers=admin_auth_headers)
    assert tx_res.status_code == 200
    tx_list = tx_res.json()["data"]
    assert len(tx_list) >= 1
    assert tx_list[0]["reason"] == "stock_added"
    assert tx_list[0]["new_quantity"] == 85


def test_admin_order_status_transition(client, auth_headers, admin_auth_headers):
    # 1. Place order as customer
    client.post("/api/cart/items", json={"product_id": 1, "quantity": 1}, headers=auth_headers)
    order_res = client.post("/api/orders", json={"address_id": 1}, headers=auth_headers)
    order_id = order_res.json()["data"]["id"]

    # 2. Advance to processing
    step1 = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "processing"},
        headers=admin_auth_headers
    )
    assert step1.status_code == 200
    assert step1.json()["data"]["status"] == "processing"

    # 3. Try illegal transition (e.g. processing -> delivered without packing)
    illegal = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "delivered"},
        headers=admin_auth_headers
    )
    assert illegal.status_code == 400
    assert illegal.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


def test_admin_customer_management(client, admin_auth_headers):
    # List customers
    list_res = client.get("/api/admin/customers", headers=admin_auth_headers)
    assert list_res.status_code == 200
    customers = list_res.json()["data"]["items"]
    assert len(customers) >= 1
    assert "password_hash" not in customers[0]

    # Toggle customer status
    cust_id = customers[0]["id"]
    toggle_res = client.patch(
        f"/api/admin/customers/{cust_id}/status",
        json={"is_active": False},
        headers=admin_auth_headers
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["data"]["is_active"] is False


def test_admin_coupon_crud(client, admin_auth_headers):
    # Create coupon
    create_res = client.post(
        "/api/admin/coupons",
        json={
            "code": "SUPERBASKET50",
            "description": "50% OFF up to ₹100",
            "discount_type": "percentage",
            "discount_value": "50.00",
            "minimum_order": "199.00",
            "maximum_discount": "100.00",
            "usage_limit": 500,
            "is_active": True
        },
        headers=admin_auth_headers
    )
    assert create_res.status_code == 201
    coupon_id = create_res.json()["data"]["id"]

    # Delete coupon
    del_res = client.delete(f"/api/admin/coupons/{coupon_id}", headers=admin_auth_headers)
    assert del_res.status_code == 200
