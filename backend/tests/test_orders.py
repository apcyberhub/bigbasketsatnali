def test_create_order_flow(client, auth_headers):
    # 1. Add item to cart
    client.post(
        "/api/cart/items",
        json={"product_id": 1, "quantity": 2},
        headers=auth_headers
    )

    # 2. Create order using default address (ID: 1) with Cash on Delivery
    order_res = client.post(
        "/api/orders",
        json={"address_id": 1, "payment_method": "Cash on Delivery"},
        headers=auth_headers
    )
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    assert order_data["order_number"].startswith("BB")
    assert order_data["status"] == "confirmed"
    assert order_data["payment_status"] == "pending"
    assert len(order_data["items"]) == 1

    order_num = order_data["order_number"]

    # 3. Retrieve order details
    get_res = client.get(f"/api/orders/{order_num}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["order_number"] == order_num
