from fastapi.testclient import TestClient


def test_register_user_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "SecurePassword123!",
            "role": "USER",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"
    # Ensure password hash is NOT exposed
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_register_duplicate_email_fails(client: TestClient):
    payload = {
        "email": "duplicate@example.com",
        "full_name": "Duplicate User",
        "password": "Password123!",
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"]


def test_login_success(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login_test@example.com",
            "full_name": "Login Test",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login_test@example.com"


def test_login_invalid_credentials_fails(client: TestClient):
    # Wrong password
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpwd@example.com",
            "full_name": "Wrong Password",
            "password": "Password123!",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpwd@example.com", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]

    # Non-existent user
    resp_none = client.post(
        "/api/v1/auth/login",
        json={"email": "doesnotexist@example.com", "password": "AnyPassword1!"},
    )
    assert resp_none.status_code == 401
    assert "Invalid email or password" in resp_none.json()["detail"]


def test_get_current_user_profile(client: TestClient, user_a_headers: dict):
    response = client.get("/api/v1/auth/me", headers=user_a_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user_a@example.com"
    assert data["full_name"] == "User Alpha"
    assert "password_hash" not in data


def test_unauthenticated_request_fails(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_invalid_token_fails(client: TestClient):
    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert response.status_code == 401


def test_logout_revokes_token(client: TestClient, user_a_headers: dict):
    # Verify user_a can access protected route
    resp1 = client.get("/api/v1/auth/me", headers=user_a_headers)
    assert resp1.status_code == 200

    # Logout
    logout_resp = client.post("/api/v1/auth/logout", headers=user_a_headers)
    assert logout_resp.status_code == 200
    assert "Successfully logged out" in logout_resp.json()["message"]

    # Verify same token is now rejected with 401 revoked
    resp2 = client.get("/api/v1/auth/me", headers=user_a_headers)
    assert resp2.status_code == 401
    assert "revoked" in resp2.json()["detail"].lower()
