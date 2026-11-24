from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy import update

from app.core.db import utcnow
from app.models import AuthToken
from app.services import account, tokens
from app.services.users import find_user_by_email
from tests.conftest import db_session

Headers = dict[str, str]


def reset_token(email: str) -> str:
    db = db_session()
    return tokens.issue(db, find_user_by_email(db, email), "reset", timedelta(hours=1))  # type: ignore[arg-type]


def test_forgot_never_reveals_accounts(client: TestClient, auth: Headers) -> None:
    assert client.post("/api/auth/forgot", json={"email": "rep@acme.com"}).status_code == 204
    assert client.post("/api/auth/forgot", json={"email": "nobody@acme.com"}).status_code == 204


def test_reset_password_is_single_use(client: TestClient, auth: Headers) -> None:
    token = reset_token("rep@acme.com")
    assert client.post("/api/auth/reset", json={"token": token, "password": "brandnewpass"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "brandnewpass"}).status_code == 200
    reused = client.post("/api/auth/reset", json={"token": token, "password": "anotherpass1"})
    assert reused.status_code == 400 and reused.json()["code"] == "invalid_token"


def test_expired_reset_token_is_rejected(client: TestClient, auth: Headers) -> None:
    token = reset_token("rep@acme.com")
    db = db_session()
    db.execute(update(AuthToken).values(expires_at=utcnow() - timedelta(minutes=1)))
    db.commit()
    assert client.post("/api/auth/reset", json={"token": token, "password": "brandnewpass"}).json()["code"] == "invalid_token"


def test_email_verification(client: TestClient, auth: Headers) -> None:
    assert client.get("/api/auth/me", headers=auth).json()["user"]["email_verified"] is False
    db = db_session()
    raw = tokens.issue(db, find_user_by_email(db, "rep@acme.com"), "verify", timedelta(hours=1))  # type: ignore[arg-type]
    assert client.post("/api/auth/verify", json={"token": raw}).json()["email_verified"] is True


def test_change_password_and_profile(client: TestClient, auth: Headers) -> None:
    wrong = client.post("/api/auth/password", headers=auth, json={"current_password": "nope", "new_password": "newsecret123"})
    assert wrong.json()["code"] == "wrong_password"
    assert client.post("/api/auth/password", headers=auth, json={"current_password": "s3cret-pass", "new_password": "newsecret123"}).status_code == 204
    assert client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "newsecret123"}).status_code == 200
    assert client.patch("/api/auth/me", headers=auth, json={"full_name": "Samantha"}).json()["full_name"] == "Samantha"


def test_demo_account_is_read_only(client: TestClient) -> None:
    demo = {"Authorization": f"Bearer {client.post('/api/auth/demo').json()['access_token']}"}
    assert client.patch("/api/auth/me", headers=demo, json={"full_name": "Hacker"}).json()["code"] == "demo_read_only"
    assert account.get_settings().demo_enabled
