"""Deleting stages: won / lost may go while another of the kind remains; deals move first, with history."""

from fastapi.testclient import TestClient

from tests.test_pipelines import Headers, default_pipeline, stages_of


def add_stage(client: TestClient, auth: Headers, pipeline_id: str, **kind: bool) -> dict:
    body = {"name": "Extra", "pipeline_id": pipeline_id, "position": 50, "probability": 100 if kind.get("is_won") else 0, **kind}
    return client.post("/api/stages", headers=auth, json=body).json()


def test_last_won_and_lost_stages_stay(client: TestClient, auth: Headers) -> None:
    stages = stages_of(client, auth, default_pipeline(client, auth)["id"])
    won = next(s for s in stages if s["is_won"])
    lost = next(s for s in stages if s["is_lost"])
    assert client.delete(f"/api/stages/{won['id']}", headers=auth).json()["code"] == "last_won_stage"
    assert client.delete(f"/api/pipelines/stages/{lost['id']}", headers=auth).json()["code"] == "last_lost_stage"


def test_a_duplicate_closed_stage_can_go(client: TestClient, auth: Headers) -> None:
    pipeline = default_pipeline(client, auth)["id"]
    extra = add_stage(client, auth, pipeline, is_won=True)
    assert client.delete(f"/api/pipelines/stages/{extra['id']}", headers=auth).status_code == 204
    assert extra["id"] not in {s["id"] for s in stages_of(client, auth, pipeline)}


def test_deals_move_to_the_chosen_stage_keeping_their_close_date(client: TestClient, auth: Headers) -> None:
    pipeline = default_pipeline(client, auth)["id"]
    lost = next(s for s in stages_of(client, auth, pipeline) if s["is_lost"])
    extra = add_stage(client, auth, pipeline, is_lost=True)
    deal = client.post("/api/deals", headers=auth, json={"title": "Gone", "stage_id": extra["id"], "lost_reason": "Price"}).json()
    assert client.delete(f"/api/pipelines/stages/{extra['id']}", headers=auth).json()["code"] == "stage_has_deals"
    assert client.delete(f"/api/pipelines/stages/{extra['id']}?move_to={extra['id']}", headers=auth).json()["code"] == "stage_move_target"
    assert client.delete(f"/api/pipelines/stages/{extra['id']}?move_to={lost['id']}", headers=auth).status_code == 204
    moved = client.get(f"/api/deals/{deal['id']}", headers=auth).json()
    assert moved["stage_id"] == lost["id"] and moved["closed_at"] == deal["closed_at"] and moved["lost_reason"] == "Price"
    events = client.get(f"/api/events?deal_id={deal['id']}", headers=auth).json()
    assert any(e["kind"] == "stage_changed" for e in events)


def test_only_admins_delete_stages(client: TestClient, auth: Headers, add_member) -> None:  # type: ignore[no-untyped-def]
    pipeline = default_pipeline(client, auth)["id"]
    extra = add_stage(client, auth, pipeline, is_lost=True)
    rep = add_member("rep2@a.com")
    assert client.delete(f"/api/pipelines/stages/{extra['id']}", headers=rep).status_code == 403
