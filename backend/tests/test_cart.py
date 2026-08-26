def test_get_empty_cart(client, auth_headers):
    response = client.get("/api/cart", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_items_count"] == 0


def test_add_to_cart_and_update(client, auth_headers):
    # 1. Add product to cart
    add_res = client.post(
        "/api/cart/items",
        json={"product_id": 1, "quantity": 2},
        headers=auth_headers
    )
    assert add_res.status_code == 201
    cart_data = add_res.json()["data"]
    assert cart_data["total_items_count"] == 2
    assert len(cart_data["items"]) == 1

    item_id = cart_data["items"][0]["id"]

    # 2. Update item quantity
    update_res = client.put(
        f"/api/cart/items/{item_id}",
        json={"quantity": 4},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["total_items_count"] == 4

    # 3. Delete item from cart
    del_res = client.delete(
        f"/api/cart/items/{item_id}",
        headers=auth_headers
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["total_items_count"] == 0
