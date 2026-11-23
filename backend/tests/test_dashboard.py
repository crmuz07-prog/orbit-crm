from fastapi.testclient import TestClient


def test_dashboard_on_sample_data(client: TestClient, auth: dict[str, str]) -> None:
    assert client.post("/api/workspace/seed", headers=auth).status_code == 204
    data = client.get("/api/dashboard", headers=auth).json()
    assert data["open_count"] > 0 and data["open_value"] >= data["weighted_value"] > 0
    assert 0 <= data["win_rate"] <= 100
    assert len(data["monthly"]) == 6 and len(data["by_stage"]) == 5
    assert len(data["top_open"]) == 5


def test_reset_is_demo_only(client: TestClient, auth: dict[str, str]) -> None:
    assert client.post("/api/workspace/reset", headers=auth).status_code == 403
