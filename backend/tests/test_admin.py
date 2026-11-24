from fastapi.testclient import TestClient

from app.core.config import get_settings
from tests.conftest import bearer

Headers = dict[str, str]


def test_superadmin_without_company_gets_a_session(client: TestClient, superadmin: Headers) -> None:
    me = client.get("/api/auth/me", headers=superadmin).json()
    assert me["user"]["is_superadmin"] and me["workspace"] is None and me["role"] is None
    assert client.get("/api/companies", headers=superadmin).status_code == 403  # CRM data needs a company


def test_superadmin_creates_company_with_owner_login(client: TestClient, superadmin: Headers) -> None:
    company = client.post("/api/admin/companies", headers=superadmin, json={"name": "Silk Road Trading", "owner": {"full_name": "Aziz", "email": "aziz@silkroad.uz", "password": "temp-pass-123"}}).json()
    assert company["member_count"] == 1 and company["owners"] == ["aziz@silkroad.uz"]
    owner = client.post("/api/auth/login", json={"email": "aziz@silkroad.uz", "password": "temp-pass-123"}).json()
    assert owner["role"] == "owner" and owner["user"]["must_change_password"]
    assert len(client.get("/api/stages", headers=bearer(owner)).json()) == 7  # default pipeline


def test_superadmin_manages_users(client: TestClient, superadmin: Headers) -> None:
    company = client.post("/api/admin/companies", headers=superadmin, json={"name": "Acme", "owner": {"full_name": "O", "email": "o@acme.com", "password": "temp-pass-123"}}).json()
    user = client.post("/api/admin/users", headers=superadmin, json={"full_name": "Rep", "email": "rep@acme.com", "password": "temp-pass-123", "workspace_id": company["id"]}).json()
    assert user["memberships"][0]["workspace_name"] == "Acme"
    token = bearer(client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "temp-pass-123"}).json())

    # Deactivation blocks new logins and already issued tokens.
    client.patch(f"/api/admin/users/{user['id']}", headers=superadmin, json={"is_active": False})
    assert client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "temp-pass-123"}).json()["code"] == "account_disabled"
    assert client.get("/api/companies", headers=token).json()["code"] == "account_disabled"

    client.patch(f"/api/admin/users/{user['id']}", headers=superadmin, json={"is_active": True})
    assert client.post(f"/api/admin/users/{user['id']}/password", headers=superadmin, json={"password": "fresh-pass-77"}).status_code == 204
    assert client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "fresh-pass-77"}).status_code == 200


def test_superadmin_cannot_lock_themselves_out(client: TestClient, superadmin: Headers) -> None:
    me = client.get("/api/auth/me", headers=superadmin).json()["user"]["id"]
    response = client.patch(f"/api/admin/users/{me}", headers=superadmin, json={"is_superadmin": False})
    assert response.status_code == 403 and response.json()["code"] == "self_lockout"


def test_admin_api_is_superadmin_only(client: TestClient, auth: Headers) -> None:
    assert client.get("/api/admin/users", headers=auth).status_code == 403


def test_closed_registration(client: TestClient) -> None:
    settings = get_settings()
    settings.registration_enabled = False
    try:
        response = client.post("/api/auth/register", json={"full_name": "X", "email": "x@x.com", "password": "longpassword"})
        assert response.status_code == 403 and response.json()["code"] == "registration_disabled"
        assert client.get("/api/auth/config").json()["registration_enabled"] is False
    finally:
        settings.registration_enabled = True


def test_env_superadmin_password_applies_to_an_existing_account(client: TestClient, auth: Headers) -> None:
    from app.services.admin import ensure_superadmin
    from tests.conftest import db_session

    # The operator put an existing login into Render, with a stray newline from copy-paste.
    ensure_superadmin(db_session(), " Rep@Acme.com ", "render-pass-1\n")
    login = client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "render-pass-1"}).json()
    assert login["user"]["is_superadmin"] is True and login["user"]["must_change_password"] is False
    # A restart with the same values changes nothing, so the session stays valid.
    ensure_superadmin(db_session(), "rep@acme.com", "render-pass-1")
    assert client.get("/api/auth/me", headers=bearer(login)).status_code == 200
