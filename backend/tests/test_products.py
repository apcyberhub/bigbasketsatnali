def test_get_categories(client):
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert data["data"][0]["slug"] == "dairy-breakfast"


def test_get_products_list(client):
    response = client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1
    assert data["data"]["pagination"]["total_count"] >= 1


def test_filter_products_by_category(client):
    response = client.get("/api/products?category=dairy-breakfast")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    for item in data["data"]["items"]:
        assert item["name"] == "Amul Taaza Toned Milk"


def test_search_products(client):
    response = client.get("/api/products/search?q=Amul")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert "Amul" in data["data"][0]["brand"]


def test_get_product_by_slug(client):
    response = client.get("/api/products/slug/amul-taaza-toned-milk-1l")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["sku"] == "SKU-TEST-MILK"
