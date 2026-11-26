from fastapi.testclient import TestClient


def test_dashboard_on_sample_data(client: TestClient, auth: dict[str, str]) -> None:
    assert client.post("/api/workspace/seed", headers=auth).status_code == 204
    data = client.get("/api/dashboard", headers=auth).json()
    assert data["open_count"] > 0 and data["open_value"] >= data["weighted_value"] > 0
    assert 0 <= data["win_rate"] <= 100
    assert len(data["monthly"]) == 6 and len(data["by_stage"]) == 5
    assert len(data["top_open"]) == 5


def test_dashboard_counts_work_without_amounts(client: TestClient, auth: dict[str, str]) -> None:
    """A workspace that never enters amounts (leads only) still gets numbers: counts, new leads, newest deals."""
    stages = client.get("/api/stages", headers=auth).json()
    first = next(s for s in stages if not s["is_won"] and not s["is_lost"])
    won = next(s for s in stages if s["is_won"])
    for title in ("Lead A", "Lead B"):
        client.post("/api/deals", headers=auth, json={"title": title, "stage_id": first["id"]})
    client.post("/api/deals", headers=auth, json={"title": "Sold", "stage_id": won["id"]})
    data = client.get("/api/dashboard", headers=auth).json()
    assert data["open_value"] == 0 and data["open_count"] == 2
    assert data["new_today"] == 3 and data["new_week"] == 3
    assert data["won_count"] == 1 and data["lost_count"] == 0
    assert data["monthly"][-1]["won_count"] == 1
    assert [d["title"] for d in data["recent_open"]] == ["Lead B", "Lead A"]
    assert next(s for s in data["by_stage"] if s["id"] == first["id"])["count"] == 2


def test_reset_is_demo_only(client: TestClient, auth: dict[str, str]) -> None:
    assert client.post("/api/workspace/reset", headers=auth).status_code == 403
