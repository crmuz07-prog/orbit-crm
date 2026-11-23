from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

Headers = dict[str, str]


def make_contact(client: TestClient, headers: Headers) -> dict:
    return client.post("/api/contacts", headers=headers, json={"first_name": "Ana", "phone": "+1 555 0100"}).json()


def test_log_call_with_follow_up_and_reminder(client: TestClient, auth: Headers) -> None:
    contact = make_contact(client, auth)
    due = datetime.now(UTC) + timedelta(days=1)
    payload = {
        "outcome": "connected", "duration_seconds": 420, "summary": "Discussed pricing", "next_steps": "Send quote",
        "contact_id": contact["id"],
        "follow_up": {"subject": "Send quote", "due_at": due.isoformat(), "remind_at": (due - timedelta(hours=1)).isoformat()},
    }
    body = client.post("/api/calls", headers=auth, json=payload).json()
    assert body["call"]["type"] == "call" and body["call"]["done"] is True
    assert body["call"]["body"] == "Discussed pricing" and body["call"]["duration_seconds"] == 420
    assert body["follow_up"]["type"] == "task" and body["follow_up"]["remind_at"]

    reminders = client.get("/api/reminders", headers=auth).json()
    assert [r["id"] for r in reminders] == [body["follow_up"]["id"]]


def test_call_stats(client: TestClient, auth: Headers) -> None:
    for outcome, seconds in [("connected", 300), ("connected", 100), ("no_answer", 0), ("voicemail", 20)]:
        client.post("/api/calls", headers=auth, json={"outcome": outcome, "duration_seconds": seconds})
    # A scheduled (future, not done) call must not count as a conversation.
    future = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    client.post("/api/activities", headers=auth, json={"type": "call", "subject": "Planned", "due_at": future})
    stats = client.get("/api/calls/stats", headers=auth).json()
    assert stats["today"] == 4 and stats["connect_rate"] == 50
    assert stats["avg_duration_seconds"] == 200 and stats["talk_time_seconds"] == 400
    assert {o["outcome"]: o["count"] for o in stats["by_outcome"]}["no_answer"] == 1


def test_completed_reminder_disappears(client: TestClient, auth: Headers) -> None:
    task = client.post("/api/activities", headers=auth, json={"type": "task", "subject": "Ping", "remind_at": datetime.now(UTC).isoformat()}).json()
    client.patch(f"/api/activities/{task['id']}", headers=auth, json={"done": True})
    assert client.get("/api/reminders", headers=auth).json() == []


def test_call_rejects_invalid_outcome_and_foreign_links(client: TestClient, auth: Headers, register) -> None:
    assert client.post("/api/calls", headers=auth, json={"outcome": "maybe"}).status_code == 422
    other = make_contact(client, register("other@x.com"))
    response = client.post("/api/calls", headers=auth, json={"outcome": "busy", "contact_id": other["id"]})
    assert response.status_code == 404 and response.json()["code"] == "not_found"
