import hashlib
import hmac
import json
from collections.abc import Callable
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.db import utcnow
from app.services import instagram_graph

Headers = dict[str, str]
SECRET = "meta-app-secret"


@pytest.fixture(autouse=True)
def no_meta(monkeypatch: pytest.MonkeyPatch) -> list[tuple[str, str]]:
    """Tests never reach Meta: profiles and sends are faked, sent messages are recorded."""
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(instagram_graph, "fetch_profile", lambda token, uid: {"name": "Dilshod Aliyev", "username": "dilshod"})
    monkeypatch.setattr(instagram_graph, "fetch_lead", lambda token, lid: None)
    monkeypatch.setattr(instagram_graph, "send_message", lambda token, rid, text: sent.append((rid, text)) or "m_out")
    return sent


def connect(client: TestClient, auth: Headers) -> str:
    client.patch("/api/instagram", headers=auth, json={"app_secret": SECRET, "access_token": "page-token", "ig_account_id": "17841"})
    return client.get("/api/instagram", headers=auth).json()["webhook_path"]


def deliver(client: TestClient, path: str, payload: dict, secret: str = SECRET) -> dict:
    body = json.dumps(payload).encode()
    signature = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return client.post(path, content=body, headers={"X-Hub-Signature-256": signature, "Content-Type": "application/json"}).json()


def dm(sender: str, mid: str, text: str, echo: bool = False) -> dict:
    event = {"sender": {"id": "17841" if echo else sender}, "recipient": {"id": sender if echo else "17841"}, "timestamp": int(utcnow().timestamp() * 1000),
             "message": {"mid": mid, "text": text, **({"is_echo": True} if echo else {})}}
    return {"object": "instagram", "entry": [{"id": "17841", "messaging": [event]}]}


def test_handshake_and_secrets_stay_hidden(client: TestClient, auth: Headers) -> None:
    path = connect(client, auth)
    settings = client.get("/api/instagram", headers=auth).json()
    assert settings["has_app_secret"] and settings["has_access_token"] and "page-token" not in json.dumps(settings)
    ok = client.get(path, params={"hub.mode": "subscribe", "hub.verify_token": settings["verify_token"], "hub.challenge": "123"})
    assert ok.status_code == 200 and ok.text == "123"
    assert client.get(path, params={"hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "1"}).status_code == 403


def test_unsigned_deliveries_are_rejected(client: TestClient, auth: Headers) -> None:
    path = connect(client, auth)
    assert deliver(client, path, dm("u1", "m1", "hi"), secret="wrong")["code"] == "invalid_signature"
    assert client.post(path, json=dm("u1", "m1", "hi")).status_code == 401


def test_direct_message_creates_contact_deal_and_feed_message(client: TestClient, auth: Headers) -> None:
    path = connect(client, auth)
    assert deliver(client, path, dm("igsid-1", "m1", "Narxi qancha?"))["received"] == 1
    assert deliver(client, path, dm("igsid-1", "m1", "Narxi qancha?"))["received"] == 0  # Meta retries are idempotent
    deliver(client, path, dm("igsid-1", "m2", "Yetkazib berasizmi?"))
    contact = next(c for c in client.get("/api/contacts", headers=auth).json() if c["instagram_id"] == "igsid-1")
    assert contact["first_name"] == "Dilshod" and contact["instagram_username"] == "dilshod"
    deals = [d for d in client.get("/api/deals", headers=auth).json() if d["contact_id"] == contact["id"]]
    assert len(deals) == 1 and deals[0]["source"] == "Instagram"
    messages = [a for a in client.get("/api/activities", headers=auth).json() if a["type"] == "message"]
    assert [m["body"] for m in messages] == ["Yetkazib berasizmi?", "Narxi qancha?"]
    assert all(m["deal_id"] == deals[0]["id"] for m in messages)


def test_reply_inside_window_and_response_time(client: TestClient, auth: Headers, no_meta: list) -> None:
    path = connect(client, auth)
    deliver(client, path, dm("igsid-2", "m1", "Salom"))
    contact = next(c for c in client.get("/api/contacts", headers=auth).json() if c["instagram_id"] == "igsid-2")
    sent = client.post("/api/instagram/reply", headers=auth, json={"contact_id": contact["id"], "text": "Assalomu alaykum!"})
    assert sent.status_code == 200 and sent.json()["call_direction"] == "outbound" and no_meta == [("igsid-2", "Assalomu alaykum!")]
    stats = client.get("/api/instagram/stats", headers=auth).json()
    assert stats["messages"] == 1 and stats["unanswered"] == 0 and stats["avg_first_response_seconds"] is not None


def test_reply_window_closed(client: TestClient, auth: Headers) -> None:
    path = connect(client, auth)
    old = dm("igsid-3", "m1", "Salom")
    old["entry"][0]["messaging"][0]["timestamp"] = int((utcnow() - timedelta(hours=30)).timestamp() * 1000)
    deliver(client, path, old)
    contact = next(c for c in client.get("/api/contacts", headers=auth).json() if c["instagram_id"] == "igsid-3")
    assert client.post("/api/instagram/reply", headers=auth, json={"contact_id": contact["id"], "text": "Hi"}).json()["code"] == "messaging_window_closed"


def test_lead_form_creates_lead_and_matches_existing_phone(client: TestClient, auth: Headers) -> None:
    path = connect(client, auth)
    client.post("/api/contacts", headers=auth, json={"first_name": "Old", "phone": "+998 90 123 45 67"})
    form = {"field": "leadgen", "value": {"leadgen_id": "L1", "ad_id": "AD9", "form_id": "F1", "field_data": [
        {"name": "full_name", "values": ["Malika Karimova"]}, {"name": "phone_number", "values": ["998901234567"]}]}}
    assert deliver(client, path, {"object": "page", "entry": [{"changes": [form]}]})["received"] == 1
    contacts = client.get("/api/contacts", headers=auth).json()
    assert len(contacts) == 1  # matched by phone, no duplicate
    stats = client.get("/api/instagram/stats", headers=auth).json()
    assert stats["lead_forms"] == 1 and stats["top_ads"] == [{"ad_id": "AD9", "leads": 1, "won": 0}]


def test_simulator_and_admin_only(client: TestClient, auth: Headers, add_member: Callable[..., Headers], no_meta: list) -> None:
    assert client.post("/api/instagram/simulate", headers=auth, json={"kind": "message", "name": "Test Mijoz"}).json()["received"] == 1
    contact = next(c for c in client.get("/api/contacts", headers=auth).json() if c["instagram_id"])
    deal = next(d for d in client.get("/api/deals", headers=auth).json() if d["contact_id"] == contact["id"])
    message = next(a for a in client.get("/api/activities", headers=auth).json() if a["type"] == "message")
    assert message["deal_id"] == deal["id"]  # the message is in the deal's feed
    assert client.post("/api/instagram/reply", headers=auth, json={"contact_id": contact["id"], "text": "Javob"}).status_code == 200
    assert no_meta == []  # simulated conversations never reach Meta
    rep = add_member("rep@a.com")
    assert client.get("/api/instagram", headers=rep).status_code == 403
    assert client.post("/api/instagram/simulate", headers=rep, json={"kind": "message"}).status_code == 403
