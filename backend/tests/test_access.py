from collections.abc import Callable

from fastapi.testclient import TestClient

Headers = dict[str, str]


def roles(client: TestClient, auth: Headers) -> dict[str, dict]:
    return {r["name"]: r for r in client.get("/api/access", headers=auth).json()["roles"]}


def user_id(client: TestClient, headers: Headers) -> str:
    return client.get("/api/auth/me", headers=headers).json()["user"]["id"]


def assign(client: TestClient, auth: Headers, member: Headers, **changes: str | None) -> None:
    assert client.patch(f"/api/team/members/{user_id(client, member)}", headers=auth, json=changes).status_code == 200


def test_workspace_starts_with_built_in_roles(client: TestClient, auth: Headers) -> None:
    built_in = roles(client, auth)
    assert set(built_in) == {"Sales rep", "Team lead", "Viewer"} and built_in["Sales rep"]["is_default"]
    assert built_in["Sales rep"]["permissions"]["deals"] == {"view": True, "create": True, "edit": True, "delete": False, "export": False, "scope": "own"}


def test_own_scope_hides_other_records_and_blocks_reassignment(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    rep = add_member("rep1@a.com")
    owners_deal = client.post("/api/companies", headers=auth, json={"name": "Owner Co"}).json()
    assert client.get(f"/api/companies/{owners_deal['id']}", headers=rep).status_code == 404
    assert client.patch(f"/api/companies/{owners_deal['id']}", headers=rep, json={"name": "X"}).status_code == 404
    mine = client.post("/api/companies", headers=rep, json={"name": "Rep Co"}).json()
    assert mine["owner_id"] == user_id(client, rep)
    handover = client.patch(f"/api/companies/{mine['id']}", headers=rep, json={"owner_id": user_id(client, auth)})
    assert handover.status_code == 403 and handover.json()["code"] == "owner_out_of_scope"
    denied = client.delete(f"/api/companies/{mine['id']}", headers=rep)
    assert denied.status_code == 403 and denied.json()["code"] == "permission_denied"


def test_team_scope_sees_teammates_and_unowned(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    lead, rep, outsider = add_member("lead@a.com"), add_member("rep2@a.com"), add_member("out@a.com")
    client.post("/api/access/teams", headers=auth, json={"name": "Tashkent"})
    team_id = client.get("/api/access", headers=auth).json()["teams"][0]["id"]
    assign(client, auth, lead, team_id=team_id, access_role_id=roles(client, auth)["Team lead"]["id"])
    assign(client, auth, rep, team_id=team_id)
    client.post("/api/companies", headers=rep, json={"name": "Teammate Co"})
    client.post("/api/companies", headers=outsider, json={"name": "Outsider Co"})
    client.post("/api/companies", headers=auth, json={"name": "Unowned Co", "owner_id": None})
    assert sorted(c["name"] for c in client.get("/api/companies", headers=lead).json()) == ["Teammate Co", "Unowned Co"]


def test_role_edit_applies_immediately_and_export(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    rep = add_member("rep3@a.com")
    assert client.get("/api/companies/export", headers=rep).status_code == 403
    role = roles(client, auth)["Sales rep"]
    widened = {**role["permissions"], "companies": {**role["permissions"]["companies"], "export": True, "scope": "all"}}
    assert client.patch(f"/api/access/roles/{role['id']}", headers=auth, json={"permissions": widened}).status_code == 204
    client.post("/api/companies", headers=auth, json={"name": "Ташкент Трейд"})
    csv = client.get("/api/companies/export", headers=rep)
    owner = client.get("/api/auth/me", headers=auth).json()["user"]["full_name"]
    assert csv.status_code == 200 and csv.text.startswith("\ufeffid,") and f",{owner},Ташкент Трейд," in csv.text
    assert client.get("/api/auth/me", headers=rep).json()["permissions"]["companies"]["export"] is True


def test_deleted_role_falls_back_to_default(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    viewer_role = roles(client, auth)["Viewer"]
    member = add_member("v@a.com")
    assign(client, auth, member, access_role_id=viewer_role["id"])
    assert client.post("/api/companies", headers=member, json={"name": "No"}).json()["code"] == "permission_denied"
    assert client.delete(f"/api/access/roles/{viewer_role['id']}", headers=auth).status_code == 204
    assert client.post("/api/companies", headers=member, json={"name": "Yes"}).status_code == 201
    default = roles(client, auth)["Sales rep"]
    assert client.delete(f"/api/access/roles/{default['id']}", headers=auth).json()["code"] == "default_role"


def test_dashboard_follows_reports_scope(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    rep = add_member("rep4@a.com")
    stage = client.get("/api/stages", headers=auth).json()[0]["id"]
    client.post("/api/deals", headers=auth, json={"title": "Big", "stage_id": stage, "amount": 1000})
    client.post("/api/deals", headers=rep, json={"title": "Small", "stage_id": stage, "amount": 10})
    assert client.get("/api/dashboard", headers=rep).json()["open_value"] == 10
    assert client.get("/api/dashboard", headers=auth).json()["open_value"] == 1010


def test_members_cannot_manage_access(client: TestClient, add_member: Callable[..., Headers]) -> None:
    rep = add_member("rep5@a.com")
    assert client.get("/api/access", headers=rep).status_code == 403
    assert client.post("/api/access/teams", headers=rep, json={"name": "X"}).status_code == 403
