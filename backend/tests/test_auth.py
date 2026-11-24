from fastapi.testclient import TestClient


def test_register_creates_workspace_with_default_pipeline(client: TestClient, auth: dict[str, str]) -> None:
    stages = client.get("/api/stages", headers=auth).json()
    assert [s["name"] for s in stages][:2] == ["Lead In", "Qualified"]
    assert sum(s["is_won"] for s in stages) == 1 and sum(s["is_lost"] for s in stages) == 1


def test_login_and_me(client: TestClient, auth: dict[str, str]) -> None:
    response = client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "s3cret-pass"})
    assert response.status_code == 200
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {response.json()['access_token']}"})
    assert me.json()["user"]["email"] == "rep@acme.com"


def test_rejects_bad_credentials_and_missing_token(client: TestClient, auth: dict[str, str]) -> None:
    assert client.post("/api/auth/login", json={"email": "rep@acme.com", "password": "wrong"}).status_code == 401
    assert client.get("/api/deals").status_code == 401


def test_duplicate_email_conflicts(client: TestClient, auth: dict[str, str]) -> None:
    payload = {"full_name": "Sam", "email": "rep@acme.com", "password": "another-pass"}
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_demo_login_returns_seeded_workspace(client: TestClient) -> None:
    token = client.post("/api/auth/demo").json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert len(client.get("/api/companies", headers=headers).json()) == 15
    assert client.post("/api/workspace/reset", headers=headers).status_code == 204


def test_validation_errors_name_the_field_with_a_stable_code(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"email": "abc@x", "password": ""})
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_error"
    assert {"field": "email", "code": "email"} in body["fields"]
    missing = client.post("/api/auth/forgot", json={}).json()
    assert missing["fields"] == [{"field": "email", "code": "required"}]
