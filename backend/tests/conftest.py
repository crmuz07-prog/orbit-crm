import os
import tempfile
from collections.abc import Callable, Iterator

# Tests must not depend on a developer's local .env (environment variables win over it), and the app's start-up
# migration must never touch the developer's database.
os.environ.update(
    JWT_SECRET="test-secret-that-is-long-enough-for-hs256", REGISTRATION_ENABLED="true", DEMO_ENABLED="true", SUPERADMIN_EMAIL="", SUPERADMIN_PASSWORD="", RATE_LIMIT_ENABLED="false",
    DATABASE_URL=f"sqlite:///{tempfile.mkdtemp()}/startup.db",
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import create_engine, event

from app.core.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

Headers = dict[str, str]


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    event.listen(engine, "connect", lambda conn, _: conn.execute("PRAGMA foreign_keys=ON"))
    Base.metadata.create_all(engine)
    # Same session settings as the app (app/core/db.py), so tests catch what production would do.
    make_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override() -> Iterator[Session]:
        with make_session() as session:
            yield session

    app.dependency_overrides[get_db] = override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def register(client: TestClient) -> Callable[[str], Headers]:
    def _register(email: str = "rep@acme.com") -> Headers:
        response = client.post("/api/auth/register", json={"full_name": "Sam Rep", "email": email, "password": "s3cret-pass"})
        assert response.status_code == 201, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _register


@pytest.fixture
def auth(register: Callable[[str], Headers]) -> Headers:
    return register("rep@acme.com")


def db_session() -> Session:
    """A session on the test database (same engine the API uses inside the test)."""
    from app.main import app as application

    return next(application.dependency_overrides[get_db]())


def bearer(body: dict) -> Headers:
    return {"Authorization": f"Bearer {body['access_token']}"}


@pytest.fixture
def superadmin(client: TestClient) -> Headers:
    from app.services.admin import ensure_superadmin

    ensure_superadmin(db_session(), "root@orbit-ops.com", "root-pass-123")
    return bearer(client.post("/api/auth/login", json={"email": "root@orbit-ops.com", "password": "root-pass-123"}).json())


@pytest.fixture
def add_member(client: TestClient, auth: Headers) -> Callable[..., Headers]:
    """Owner of `auth` issues a login; returns the new member's headers after their first sign-in."""

    def _add(email: str, role: str = "member", password: str = "temp-pass-123") -> Headers:
        created = client.post("/api/team/members", headers=auth, json={"full_name": email.split("@")[0], "email": email, "role": role, "password": password})
        assert created.status_code == 201, created.text
        assert created.json()["account_created"] is True
        return bearer(client.post("/api/auth/login", json={"email": email, "password": password}).json())

    return _add
