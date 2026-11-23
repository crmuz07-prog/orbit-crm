import asyncio
import json
from typing import Any

from fastapi.testclient import TestClient

from app.services.events import EventBroker
from app.services.phone_match import phone_key
from app.services.telephony import sign

Headers = dict[str, str]


def setup(client: TestClient, auth: Headers) -> dict[str, str]:
    return client.get("/api/telephony", headers=auth).json()


def send(client: TestClient, settings: dict[str, str], payload: dict[str, Any], secret: str | None = None) -> Any:
    body = json.dumps(payload).encode()
    signature = sign(secret or settings["signing_secret"], body)
    return client.post(settings["webhook_path"], content=body, headers={"X-Orbit-Signature": signature, "Content-Type": "application/json"})


def event(name: str, phone: str = "+998 90 123 45 67", **extra: Any) -> dict[str, Any]:
    return {"event": name, "call_id": "pbx-1", "direction": "inbound", "from": phone, "to": "+998712000000", **extra}


def test_phone_key_matches_local_and_international_formats() -> None:
    assert phone_key("+998 (90) 123-45-67") == phone_key("90 123 45 67") == "901234567"


def test_call_lifecycle_is_logged_on_matched_contact_and_deal(client: TestClient, auth: Headers) -> None:
    contact = client.post("/api/contacts", headers=auth, json={"first_name": "Ana", "phone": "998901234567"}).json()
    stage = client.get("/api/stages", headers=auth).json()[0]
    deal = client.post("/api/deals", headers=auth, json={"title": "Pilot", "stage_id": stage["id"], "contact_id": contact["id"]}).json()
    settings = setup(client, auth)

    assert send(client, settings, event("call.ringing")).status_code == 200
    assert send(client, settings, event("call.ended", status="answered", duration=245, recording_url="https://rec/1.mp3")).status_code == 200

    calls = [a for a in client.get("/api/activities", headers=auth).json() if a["type"] == "call"]
    assert len(calls) == 1
    call = calls[0]
    assert call["auto_logged"] and call["done"] and call["call_outcome"] == "connected"
    assert call["duration_seconds"] == 245 and call["recording_url"] == "https://rec/1.mp3"
    assert call["contact_id"] == contact["id"] and call["deal_id"] == deal["id"]


def test_rejects_bad_signature(client: TestClient, auth: Headers) -> None:
    response = send(client, setup(client, auth), event("call.ringing"), secret="wrong")
    assert response.status_code == 401 and response.json()["code"] == "invalid_signature"


def test_missed_call_creates_contact_and_one_callback_reminder(client: TestClient, auth: Headers) -> None:
    settings = setup(client, auth)
    for _ in range(2):  # providers retry webhooks: the second delivery must be a no-op
        send(client, settings, event("call.missed", phone="+44 20 7946 0958"))
    contacts = client.get("/api/contacts", headers=auth).json()
    assert [c["phone"] for c in contacts] == ["+44 20 7946 0958"]
    reminders = client.get("/api/reminders", headers=auth).json()
    assert len(reminders) == 1 and reminders[0]["subject"].startswith("Call back")


def test_rotating_invalidates_old_webhook(client: TestClient, auth: Headers) -> None:
    old = setup(client, auth)
    client.post("/api/telephony/rotate", headers=auth)
    assert send(client, old, event("call.ringing")).status_code == 404


def test_simulator_runs_the_same_pipeline(client: TestClient, auth: Headers) -> None:
    started = client.post("/api/telephony/simulate", headers=auth, json={"action": "start", "phone": "+998901112233"}).json()
    assert started["activity"]["done"] is False
    ended = client.post("/api/telephony/simulate", headers=auth, json={"action": "end", "call_id": started["call_id"], "phone": "+998901112233", "duration": 60}).json()
    assert ended["activity"]["id"] == started["activity"]["id"] and ended["activity"]["done"] is True


def test_broker_delivers_to_workspace_subscribers_only() -> None:
    async def scenario() -> list[Any]:
        broker = EventBroker()
        broker.bind(asyncio.get_running_loop())
        stream = broker.subscribe("ws-1")
        first = asyncio.ensure_future(anext(stream))
        await asyncio.sleep(0)
        broker.publish("ws-2", {"n": 0})
        broker.publish("ws-1", {"n": 1})
        return [await asyncio.wait_for(first, 1)]

    assert asyncio.run(scenario()) == [{"n": 1}]
