import pytest
from decimal import Decimal
from app.models.product import Product
from app.models.category import Category


@pytest.fixture
def populated_db(db_session):
    # Add extra categories
    cat_fruits = Category(name="Fruits & Vegetables", slug="fruits-vegetables", icon="🍎", is_active=True, sort_order=2)
    cat_snacks = Category(name="Snacks & Namkeen", slug="snacks", icon="🍿", is_active=True, sort_order=3)
    db_session.add_all([cat_fruits, cat_snacks])
    db_session.flush()

    # Add diverse products for search and discovery testing
    p1 = Product(
        sku="SKU-BUTTER-1",
        name="Amul Pasteurised Butter",
        slug="amul-butter-500g",
        brand="Amul",
        category_id=1,
        subcategory_name="Butter & Spreads",
        price=Decimal("275.00"),
        mrp=Decimal("290.00"),
        discount_percentage=5,
        stock_quantity=40,
        tags="dairy, amul, butter",
        rating=Decimal("4.9"),
        review_count=85,
        is_active=True
    )
    p2 = Product(
        sku="SKU-CHEESE-1",
        name="Britannia Cheese Slices",
        slug="britannia-cheese-slices",
        brand="Britannia",
        category_id=1,
        subcategory_name="Cheese",
        price=Decimal("145.00"),
        mrp=Decimal("170.00"),
        discount_percentage=15,
        stock_quantity=25,
        tags="cheese, dairy, slices",
        rating=Decimal("4.6"),
        review_count=40,
        is_active=True
    )
    p3 = Product(
        sku="SKU-APPLE-1",
        name="Fresh Royal Gala Apples",
        slug="fresh-royal-gala-apples-1kg",
        brand="FreshFarm",
        category_id=cat_fruits.id,
        subcategory_name="Fresh Fruits",
        price=Decimal("180.00"),
        mrp=Decimal("220.00"),
        discount_percentage=18,
        stock_quantity=30,
        tags="apple, fruit, fresh, healthy",
        rating=Decimal("4.7"),
        review_count=12,
        is_active=True
    )
    p4 = Product(
        sku="SKU-CHIPS-1",
        name="Lay's India's Magic Masala Chips",
        slug="lays-magic-masala-chips",
        brand="Lay's",
        category_id=cat_snacks.id,
        subcategory_name="Chips & Crisps",
        price=Decimal("20.00"),
        mrp=Decimal("20.00"),
        discount_percentage=0,
        stock_quantity=0,  # Out of stock
        tags="chips, snacks, masala, potato",
        rating=Decimal("4.3"),
        review_count=150,
        is_active=True
    )
    p5 = Product(
        sku="SKU-CHOCO-1",
        name="Cadbury Dairy Milk Silk Chocolate",
        slug="cadbury-silk-150g",
        brand="Cadbury",
        category_id=cat_snacks.id,
        subcategory_name="Chocolates",
        price=Decimal("175.00"),
        mrp=Decimal("190.00"),
        discount_percentage=8,
        stock_quantity=60,
        tags="chocolate, silk, cadbury, sweet",
        rating=Decimal("4.95"),
        review_count=320,
        is_active=True
    )

    db_session.add_all([p1, p2, p3, p4, p5])
    db_session.commit()
    return True


def test_get_products_pagination(client, populated_db):
    response = client.get("/api/products?page=1&limit=3")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) == 3
    assert data["data"]["pagination"]["page"] == 1
    assert data["data"]["pagination"]["limit"] == 3
    assert data["data"]["pagination"]["total_count"] >= 6


def test_product_search_by_name(client, populated_db):
    response = client.get("/api/products?search=milk")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) >= 1
    assert any("milk" in p["name"].lower() for p in items)


def test_product_search_by_brand(client, populated_db):
    response = client.get("/api/products?search=amul")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) >= 2
    assert all("amul" in p["brand"].lower() or "amul" in p["name"].lower() for p in items)


def test_product_filter_by_category_slug(client, populated_db):
    response = client.get("/api/products?category=dairy-breakfast")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) >= 2
    assert all(p["category_id"] == 1 for p in items)


def test_product_filter_by_subcategory(client, populated_db):
    response = client.get("/api/products?subcategory=Fresh Fruits")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Fresh Royal Gala Apples"


def test_product_filter_by_price_range(client, populated_db):
    response = client.get("/api/products?min_price=100&max_price=200")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) >= 3
    for p in items:
        assert 100 <= float(p["price"]) <= 200


def test_product_filter_by_discount(client, populated_db):
    response = client.get("/api/products?discount=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) >= 2
    for p in items:
        assert p["discount_percentage"] >= 10


def test_product_filter_by_availability_in_stock(client, populated_db):
    response = client.get("/api/products?availability=in_stock")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert all(p["stock_quantity"] > 0 for p in items)


def test_product_filter_by_availability_out_of_stock(client, populated_db):
    response = client.get("/api/products?availability=out_of_stock")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Lay's India's Magic Masala Chips"


def test_product_sorting_price_low(client, populated_db):
    response = client.get("/api/products?sort=price-low&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    prices = [float(p["price"]) for p in items]
    assert prices == sorted(prices)


def test_product_sorting_price_high(client, populated_db):
    response = client.get("/api/products?sort=price-high&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    items = data["data"]["items"]
    prices = [float(p["price"]) for p in items]
    assert prices == sorted(prices, reverse=True)


def test_search_suggestions_api(client, populated_db):
    response = client.get("/api/products/suggestions?q=amul")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    sugg = data["data"]
    assert sugg["query"] == "amul"
    assert len(sugg["products"]) >= 2
    assert "Amul" in sugg["brands"]


def test_get_brands_api(client, populated_db):
    response = client.get("/api/products/brands")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    brands = data["data"]
    assert "Amul" in brands
    assert "Britannia" in brands
