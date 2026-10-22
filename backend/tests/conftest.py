import contextlib
import os
from collections.abc import Generator

# Disable rate limiting for the automated test suite
os.environ["DISABLE_RATE_LIMIT"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Use an isolated test database file
TEST_DB_FILE = "./test_leadflow.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_FILE):
        with contextlib.suppress(Exception):
            os.remove(TEST_DB_FILE)

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_FILE):
        with contextlib.suppress(Exception):
            os.remove(TEST_DB_FILE)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a_headers(client: TestClient) -> dict:
    """Register and login User A, returning Authorization headers."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user_a@example.com",
            "full_name": "User Alpha",
            "password": "Password123!",
            "role": "USER",
        },
    )
    if resp.status_code == 409:
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "user_a@example.com", "password": "Password123!"},
        )
        token = login_resp.json()["access_token"]
    else:
        token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_b_headers(client: TestClient) -> dict:
    """Register and login User B, returning Authorization headers."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user_b@example.com",
            "full_name": "User Beta",
            "password": "Password123!",
            "role": "USER",
        },
    )
    if resp.status_code == 409:
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "user_b@example.com", "password": "Password123!"},
        )
        token = login_resp.json()["access_token"]
    else:
        token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client: TestClient) -> dict:
    """Register and login Admin User, returning Authorization headers."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin_test@example.com",
            "full_name": "Admin Tester",
            "password": "AdminPassword123!",
            "role": "ADMIN",
        },
    )
    if resp.status_code == 409:
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "admin_test@example.com", "password": "AdminPassword123!"},
        )
        token = login_resp.json()["access_token"]
    else:
        token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
