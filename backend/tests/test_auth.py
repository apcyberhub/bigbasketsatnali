def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"


def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Rohan Verma",
            "email": "rohan.verma@example.com",
            "phone": "9812345678",
            "password": "SecurePassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "rohan.verma@example.com"


def test_register_duplicate_email(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Duplicate User",
            "email": "test.customer@example.com",
            "phone": "9998887776",
            "password": "password123"
        }
    )
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_EMAIL"


def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={
            "identifier": "test.customer@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["full_name"] == "Test Customer"


def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        json={
            "identifier": "test.customer@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


def test_get_current_user_me(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "test.customer@example.com"
