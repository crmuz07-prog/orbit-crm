from collections.abc import Callable
from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.services import billing

Headers = dict[str, str]


def test_month_arithmetic_clamps_month_ends() -> None:
    assert billing.add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert billing.add_months(date(2028, 1, 31), 1) == date(2028, 2, 29)
    assert billing.add_months(date(2026, 2, 28), 1) == date(2026, 3, 28)  # no snapping to the month end
    assert billing.add_months(date(2026, 11, 30), 3) == date(2027, 2, 28)


def test_end_date_is_inclusive() -> None:
    day = date(2026, 9, 22)
    assert not billing.is_expired(day, on=day)
    assert billing.is_expired(day, on=day + timedelta(days=1))
    assert not billing.is_expired(None, on=day)


def company_id(client: TestClient, superadmin: Headers, name: str) -> str:
    return next(c["id"] for c in client.get("/api/admin/companies", headers=superadmin).json() if c["name"] == name)


def test_expired_and_blocked_companies_are_closed(client: TestClient, auth: Headers, superadmin: Headers) -> None:
    ws = company_id(client, superadmin, "Sam's workspace")
    yesterday = (billing.today() - timedelta(days=1)).isoformat()
    assert client.patch(f"/api/admin/companies/{ws}", headers=superadmin, json={"subscription_ends_at": yesterday}).json()["status"] == "expired"
    response = client.get("/api/companies", headers=auth)
    assert response.status_code == 403 and response.json()["code"] == "subscription_expired"
    me = client.get("/api/auth/me", headers=auth).json()
    assert me["workspace"]["status"] == "expired"  # the session still loads, so the UI can explain

    client.patch(f"/api/admin/companies/{ws}", headers=superadmin, json={"subscription_ends_at": None, "status": "blocked"})
    assert client.get("/api/companies", headers=auth).json()["code"] == "company_blocked"
    client.patch(f"/api/admin/companies/{ws}", headers=superadmin, json={"status": "active"})
    assert client.get("/api/companies", headers=auth).status_code == 200


def test_payment_extends_and_stacks(client: TestClient, auth: Headers, superadmin: Headers) -> None:
    ws = company_id(client, superadmin, "Sam's workspace")
    lapsed = (billing.today() - timedelta(days=10)).isoformat()
    client.patch(f"/api/admin/companies/{ws}", headers=superadmin, json={"subscription_ends_at": lapsed})
    first = client.post(f"/api/admin/companies/{ws}/payments", headers=superadmin, json={"amount": 1000000, "months": 1, "seats": 5}).json()
    assert first["period_start"] == billing.today().isoformat()  # a lapsed subscription restarts today
    second = client.post(f"/api/admin/companies/{ws}/payments", headers=superadmin, json={"amount": 3000000, "months": 3}).json()
    assert second["period_start"] == first["period_end"]  # paying early stacks on top
    company = client.get("/api/admin/companies", headers=superadmin).json()
    sam = next(c for c in company if c["id"] == ws)
    assert sam["status"] == "active" and sam["seat_limit"] == 5 and sam["price_paid"] == 4000000
    assert sam["subscription_ends_at"] == second["period_end"]
    assert len(client.get("/api/admin/payments", headers=superadmin).json()) == 2
    assert client.get("/api/companies", headers=auth).status_code == 200


def test_seat_limit(client: TestClient, auth: Headers, superadmin: Headers, add_member: Callable[..., Headers]) -> None:
    ws = company_id(client, superadmin, "Sam's workspace")
    client.patch(f"/api/admin/companies/{ws}", headers=superadmin, json={"seat_limit": 2})
    member = add_member("second@a.com")
    full = client.post("/api/team/members", headers=auth, json={"full_name": "Third", "email": "third@a.com", "password": "temp-pass-123"})
    assert full.status_code == 409 and full.json()["code"] == "seat_limit_reached"
    assert client.get("/api/auth/me", headers=auth).json()["workspace"]["seats_used"] == 2

    # A deactivated user frees the seat, and cannot come back while the seats are full.
    second_id = client.get("/api/auth/me", headers=member).json()["user"]["id"]
    client.patch(f"/api/admin/users/{second_id}", headers=superadmin, json={"is_active": False})
    assert client.post("/api/team/members", headers=auth, json={"full_name": "Third", "email": "third@a.com", "password": "temp-pass-123"}).status_code == 201
    back = client.patch(f"/api/admin/users/{second_id}", headers=superadmin, json={"is_active": True})
    assert back.status_code == 409 and back.json()["code"] == "seat_limit_reached"


def test_demo_is_never_blocked(client: TestClient, superadmin: Headers) -> None:
    demo = {"Authorization": f"Bearer {client.post('/api/auth/demo').json()['access_token']}"}
    ws = company_id(client, superadmin, "Orbit Demo")
    client.patch(f"/api/admin/companies/{ws}", headers=superadmin, json={"status": "blocked"})
    assert client.get("/api/companies", headers=demo).status_code == 200


def test_billing_is_superadmin_only(client: TestClient, auth: Headers) -> None:
    assert client.get("/api/admin/payments", headers=auth).status_code == 403
