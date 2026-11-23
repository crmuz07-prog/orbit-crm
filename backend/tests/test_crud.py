from collections.abc import Callable

from fastapi.testclient import TestClient

Headers = dict[str, str]


def first_stage(client: TestClient, headers: Headers, **flags: bool) -> dict:
    stages = client.get("/api/stages", headers=headers).json()
    return next(s for s in stages if all(s[k] == v for k, v in flags.items()))


def create_deal(client: TestClient, headers: Headers, **extra: object) -> dict:
    stage = first_stage(client, headers, is_won=False, is_lost=False)
    response = client.post("/api/deals", headers=headers, json={"title": "Pilot", "amount": 5000, "stage_id": stage["id"], **extra})
    assert response.status_code == 201, response.text
    return response.json()


def test_company_crud_roundtrip(client: TestClient, auth: Headers) -> None:
    created = client.post("/api/companies", headers=auth, json={"name": "Acme"}).json()
    updated = client.patch(f"/api/companies/{created['id']}", headers=auth, json={"lifecycle": "customer"}).json()
    assert updated["lifecycle"] == "customer" and updated["name"] == "Acme"
    assert client.delete(f"/api/companies/{created['id']}", headers=auth).status_code == 204
    assert client.get(f"/api/companies/{created['id']}", headers=auth).status_code == 404


def test_validation_errors(client: TestClient, auth: Headers) -> None:
    assert client.post("/api/companies", headers=auth, json={"name": ""}).status_code == 422
    assert client.post("/api/companies", headers=auth, json={"name": "X", "lifecycle": "vip"}).status_code == 422


def test_tenant_isolation(client: TestClient, register: Callable[[str], Headers]) -> None:
    alice, bob = register("alice@a.com"), register("bob@b.com")
    company = client.post("/api/companies", headers=alice, json={"name": "Alice Co"}).json()
    assert client.get("/api/companies", headers=bob).json() == []
    assert client.get(f"/api/companies/{company['id']}", headers=bob).status_code == 404
    # Bob cannot link his records to Alice's company either.
    response = client.post("/api/contacts", headers=bob, json={"first_name": "Eve", "company_id": company["id"]})
    assert response.status_code == 404


def test_deal_closing_rules(client: TestClient, auth: Headers) -> None:
    deal = create_deal(client, auth)
    lost = first_stage(client, auth, is_lost=True)
    closed = client.patch(f"/api/deals/{deal['id']}", headers=auth, json={"stage_id": lost["id"], "lost_reason": "No budget"}).json()
    assert closed["closed_at"] and closed["lost_reason"] == "No budget"
    reopened = client.patch(f"/api/deals/{deal['id']}", headers=auth, json={"stage_id": deal["stage_id"]}).json()
    assert reopened["closed_at"] is None and reopened["lost_reason"] is None


def test_stage_with_deals_cannot_be_deleted(client: TestClient, auth: Headers) -> None:
    deal = create_deal(client, auth)
    assert client.delete(f"/api/stages/{deal['stage_id']}", headers=auth).status_code == 409


def test_deleting_company_unlinks_deals(client: TestClient, auth: Headers) -> None:
    company = client.post("/api/companies", headers=auth, json={"name": "Gone Inc"}).json()
    deal = create_deal(client, auth, company_id=company["id"])
    client.delete(f"/api/companies/{company['id']}", headers=auth)
    assert client.get(f"/api/deals/{deal['id']}", headers=auth).json()["company_id"] is None
