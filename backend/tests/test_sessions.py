from collections.abc import Callable

from fastapi.testclient import TestClient

Headers = dict[str, str]


def test_admin_password_reset_signs_the_member_out(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    member = add_member("m@a.com")
    member_id = client.get("/api/auth/me", headers=member).json()["user"]["id"]
    client.post(f"/api/team/members/{member_id}/password", headers=auth, json={"password": "another-temp-1"})
    response = client.get("/api/companies", headers=member)
    assert response.status_code == 401 and response.json()["code"] == "session_revoked"


def test_login_is_rate_limited_per_account(client: TestClient, auth: Headers) -> None:
    for _ in range(5):
        assert client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "wrong-one"}).status_code == 401
    blocked = client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "s3cret-pass"})
    assert blocked.status_code == 429 and blocked.json()["code"] == "too_many_attempts"


def test_superadmin_sees_login_attempts(client: TestClient, superadmin: Headers, auth: Headers) -> None:
    client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "wrong-one"}, headers={"X-Forwarded-For": "203.0.113.7"})
    attempts = client.get("/api/admin/login-attempts", headers=superadmin).json()
    failed = next(a for a in attempts if a["email"] == "rep@acme.com")
    assert failed["success"] is False and failed["ip"] == "203.0.113.7"
