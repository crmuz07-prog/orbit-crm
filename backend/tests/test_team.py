from collections.abc import Callable

from fastapi.testclient import TestClient

from tests.conftest import bearer

Headers = dict[str, str]


def test_admin_issued_login_must_be_changed_on_first_sign_in(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    member = add_member("nia@acme.com")
    me = client.get("/api/auth/me", headers=member).json()
    assert me["role"] == "member" and me["workspace"]["name"] == "Sam's workspace" and me["user"]["must_change_password"]
    changed = client.post("/api/auth/password", headers=member, json={"current_password": "temp-pass-123", "new_password": "my-own-pass"})
    assert client.get("/api/auth/me", headers=member).json()["code"] == "session_revoked"  # other sessions are signed out
    member = bearer(changed.json())
    assert client.get("/api/auth/me", headers=member).json()["user"]["must_change_password"] is False
    # New members start on the default "Sales rep" role: they work with their own records only.
    client.post("/api/companies", headers=auth, json={"name": "Owner's Co"})
    client.post("/api/companies", headers=member, json={"name": "Nia's Co"})
    assert [c["name"] for c in client.get("/api/companies", headers=member).json()] == ["Nia's Co"]
    assert len(client.get("/api/companies", headers=auth).json()) == 2


def test_existing_account_gains_membership_and_can_switch(client: TestClient, auth: Headers, register: Callable[[str], Headers]) -> None:
    other = register("bob@b.com")
    created = client.post("/api/team/members", headers=auth, json={"full_name": "Bob", "email": "bob@b.com", "role": "admin", "password": "ignored-pass"})
    assert created.status_code == 201 and created.json()["account_created"] is False  # existing password untouched
    choices = client.get("/api/auth/workspaces", headers=other).json()
    assert len(choices) == 2
    joined = next(w for w in choices if w["role"] == "admin")
    switched = client.post("/api/auth/switch", headers=other, json={"workspace_id": joined["id"]}).json()
    assert switched["role"] == "admin"
    assert client.post("/api/team/members", headers=auth, json={"full_name": "Bob", "email": "bob@b.com", "password": "ignored-pass"}).json()["code"] == "already_member"


def test_role_guards_and_last_owner(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    member = add_member("m@a.com")
    assert client.post("/api/team/members", headers=member, json={"full_name": "X", "email": "x@a.com", "password": "temp-pass-123"}).status_code == 403
    owner_id = next(m["user_id"] for m in client.get("/api/team", headers=auth).json()["members"] if m["role"] == "owner")
    response = client.patch(f"/api/team/members/{owner_id}", headers=auth, json={"role": "member"})
    assert response.status_code == 409 and response.json()["code"] == "last_owner"


def test_admin_cannot_grant_ownership(client: TestClient, add_member: Callable[..., Headers]) -> None:
    admin = add_member("ad@a.com", "admin")
    assert client.post("/api/team/members", headers=admin, json={"full_name": "O", "email": "o@a.com", "role": "owner", "password": "temp-pass-123"}).status_code == 403
    assert client.post("/api/team/members", headers=admin, json={"full_name": "M", "email": "m2@a.com", "password": "temp-pass-123"}).status_code == 201


def test_admin_sets_temporary_password(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    member = add_member("pat@a.com")
    user_id = client.get("/api/auth/me", headers=member).json()["user"]["id"]
    assert client.post(f"/api/team/members/{user_id}/password", headers=auth, json={"password": "reset-pass-99"}).status_code == 204
    login = client.post("/api/auth/login", json={"email": "pat@a.com", "password": "reset-pass-99"}).json()
    assert login["user"]["must_change_password"] is True


def test_removed_member_loses_access(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    member = add_member("gone@a.com")
    user_id = client.get("/api/auth/me", headers=member).json()["user"]["id"]
    assert client.delete(f"/api/team/members/{user_id}", headers=auth).status_code == 204
    assert client.get("/api/companies", headers=member).status_code == 403


def test_members_cannot_change_pipeline_or_read_webhook_secret(client: TestClient, add_member: Callable[..., Headers]) -> None:
    member = add_member("rep2@a.com")
    stage = client.get("/api/stages", headers=member).json()[0]
    assert client.patch(f"/api/stages/{stage['id']}", headers=member, json={"name": "Hacked"}).status_code == 403
    assert client.get("/api/telephony", headers=member).status_code == 403
    assert client.post("/api/companies", headers=member, json={"name": "Rep's lead"}).status_code == 201


def test_demo_team_is_read_only(client: TestClient) -> None:
    demo = {"Authorization": f"Bearer {client.post('/api/auth/demo').json()['access_token']}"}
    response = client.post("/api/team/members", headers=demo, json={"full_name": "X", "email": "x@y.com", "password": "temp-pass-123"})
    assert response.status_code == 403 and response.json()["code"] == "demo_read_only"
    assert client.get("/api/team", headers=demo).json()["can_manage"] is False
