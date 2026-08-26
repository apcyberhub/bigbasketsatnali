import os
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set testing environment before importing app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-execution"

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models import User, Category, Product, Address, Cart, DeliveryZone

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    # Seed core test category
    cat = Category(
        name="Dairy & Breakfast",
        slug="dairy-breakfast",
        icon="🥛",
        discount_label="Up to 20% OFF",
        is_active=True,
        sort_order=1
    )
    session.add(cat)
    session.flush()

    # Seed core test product
    prod = Product(
        sku="SKU-TEST-MILK",
        name="Amul Taaza Toned Milk",
        slug="amul-taaza-toned-milk-1l",
        brand="Amul",
        category_id=cat.id,
        price=Decimal("56.00"),
        mrp=Decimal("62.00"),
        discount_percentage=10,
        stock_quantity=50,
        low_stock_threshold=10,
        unit="carton",
        weight="1 L",
        emoji="🥛",
        badge="Bestseller",
        eta="10 mins",
        rating=Decimal("4.80"),
        review_count=100,
        is_active=True,
        is_featured=True
    )
    session.add(prod)

    # Seed test user
    user = User(
        full_name="Test Customer",
        email="test.customer@example.com",
        phone="9876543210",
        password_hash=hash_password("password123"),
        is_active=True,
        is_verified=True,
        is_admin=False
    )
    session.add(user)
    session.flush()

    # Add cart for test user
    session.add(Cart(user_id=user.id))

    # Add address for test user
    session.add(Address(
        user_id=user.id,
        full_name="Test Customer",
        phone="9876543210",
        address_line1="Flat 101, Galaxy Heights",
        address_line2="Station Road",
        city="Satnali",
        state="Haryana",
        pincode="123024",
        address_type="home",
        is_default=True
    ))

    # Add default delivery zone for test suite
    session.add(DeliveryZone(
        name="Satnali Core Zone",
        pincodes="123024, 123025",
        city="Satnali",
        state="Haryana",
        delivery_fee=Decimal("30.00"),
        free_delivery_threshold=Decimal("499.00"),
        minimum_order=Decimal("0.00"),
        estimated_min_minutes=15,
        estimated_max_minutes=30,
        is_active=True
    ))

    session.commit()
    session.close()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    response = client.post(
        "/api/auth/login",
        json={"identifier": "test.customer@example.com", "password": "password123"}
    )
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


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
