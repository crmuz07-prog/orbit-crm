from collections.abc import Callable

from fastapi.testclient import TestClient

Headers = dict[str, str]


def default_pipeline(client: TestClient, auth: Headers) -> dict:
    return next(p for p in client.get("/api/pipelines", headers=auth).json() if p["is_default"])


def stages_of(client: TestClient, auth: Headers, pipeline_id: str) -> list[dict]:
    return [s for s in client.get("/api/stages", headers=auth).json() if s["pipeline_id"] == pipeline_id]


def test_workspace_starts_with_one_pipeline(client: TestClient, auth: Headers) -> None:
    pipeline = default_pipeline(client, auth)
    stages = stages_of(client, auth, pipeline["id"])
    assert len(stages) == 7 and any(s["is_won"] for s in stages) and any(s["is_lost"] for s in stages)


def test_pipeline_lifecycle_and_guards(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    created = client.post("/api/pipelines", headers=auth, json={"name": "Partners"}).json()
    stages = stages_of(client, auth, created["id"])
    assert len(stages) == 7  # each pipeline has its own won/lost stages
    client.post("/api/deals", headers=auth, json={"title": "Reseller", "stage_id": stages[0]["id"]})
    assert client.delete(f"/api/pipelines/{created['id']}", headers=auth).json()["code"] == "pipeline_has_deals"
    assert client.delete(f"/api/pipelines/{default_pipeline(client, auth)['id']}", headers=auth).json()["code"] == "default_pipeline"
    rep = add_member("rep@a.com")
    assert client.post("/api/pipelines", headers=rep, json={"name": "Mine"}).status_code == 403


def test_stage_rule_and_sla_fields(client: TestClient, auth: Headers) -> None:
    stage = stages_of(client, auth, default_pipeline(client, auth)["id"])[0]
    patched = client.patch(f"/api/stages/{stage['id']}", headers=auth, json={"description": "Max 24 hours here", "max_days": 1}).json()
    assert patched["description"] == "Max 24 hours here" and patched["max_days"] == 1


def test_feed_events_record_changes_with_actor(client: TestClient, auth: Headers) -> None:
    stages = stages_of(client, auth, default_pipeline(client, auth)["id"])
    deal = client.post("/api/deals", headers=auth, json={"title": "alicom", "stage_id": stages[0]["id"]}).json()
    assert deal["stage_entered_at"] is not None
    client.patch(f"/api/deals/{deal['id']}", headers=auth, json={"amount": 100000, "stage_id": stages[1]["id"]})
    events = client.get("/api/events", headers=auth, params={"deal_id": deal["id"]}).json()
    me = client.get("/api/auth/me", headers=auth).json()["user"]["id"]
    assert [e["kind"] for e in events] == ["created", "stage_changed", "updated"]
    assert events[1]["changes"] == {"from": stages[0]["id"], "to": stages[1]["id"]} and events[1]["actor_id"] == me
    assert events[2]["changes"] == [{"field": "amount", "old": 0.0, "new": 100000.0}]
    times = {t["stage_id"]: t["seconds"] for t in client.get(f"/api/deals/{deal['id']}/stage-times", headers=auth).json()}
    assert set(times) == {stages[0]["id"], stages[1]["id"]}


def test_events_follow_record_visibility(client: TestClient, auth: Headers, add_member: Callable[..., Headers]) -> None:
    company = client.post("/api/companies", headers=auth, json={"name": "Owner Co"}).json()
    rep = add_member("rep2@a.com")
    assert client.get("/api/events", headers=rep, params={"company_id": company["id"]}).status_code == 404
    assert len(client.get("/api/events", headers=auth, params={"company_id": company["id"]}).json()) == 1


def test_deal_movement_report(client: TestClient, auth: Headers) -> None:
    pipeline = default_pipeline(client, auth)
    stages = stages_of(client, auth, pipeline["id"])
    deal = client.post("/api/deals", headers=auth, json={"title": "Moving", "stage_id": stages[0]["id"]}).json()
    client.patch(f"/api/deals/{deal['id']}", headers=auth, json={"stage_id": stages[2]["id"]})
    rows = {r["stage_id"]: r for r in client.get("/api/reports/deal-movement", headers=auth, params={"pipeline_id": pipeline["id"]}).json()}
    assert rows[stages[0]["id"]]["entered"] == 1 and rows[stages[0]["id"]]["deals_now"] == 0
    assert rows[stages[2]["id"]]["deals_now"] == 1
