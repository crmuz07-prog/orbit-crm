"""Request body limits and webhook replay / link checks."""

from datetime import timedelta

from fastapi.testclient import TestClient

from app.core.db import utcnow
from tests.test_telephony import Headers, event, send, setup


def test_oversized_bodies_are_refused_before_parsing(client: TestClient, auth: Headers) -> None:
    big = b'{"first_name":"' + b"a" * (2 * 1024 * 1024) + b'"}'
    response = client.post("/api/contacts", headers={**auth, "Content-Type": "application/json"}, content=big)
    assert response.status_code == 413 and response.json()["code"] == "payload_too_large"


def test_chunked_bodies_are_counted_too(client: TestClient, auth: Headers) -> None:
    chunks = (b"x" * 65536 for _ in range(32))  # 2 MB without a Content-Length
    response = client.post("/api/contacts", headers={**auth, "Content-Type": "application/json"}, content=chunks)
    assert response.status_code == 413


def test_imports_get_the_larger_allowance(client: TestClient, auth: Headers) -> None:
    body = b'{"filename":"a.xlsx","content":"' + b"A" * (3 * 1024 * 1024) + b'"}'
    response = client.post("/api/import/preview", headers={**auth, "Content-Type": "application/json"}, content=body)
    assert response.status_code != 413


def test_replayed_old_call_events_are_refused(client: TestClient, auth: Headers) -> None:
    settings = setup(client, auth)
    stale = (utcnow() - timedelta(days=2)).isoformat()
    future = (utcnow() + timedelta(hours=1)).isoformat()
    assert send(client, settings, event("call.ringing", timestamp=stale)).status_code == 400
    assert send(client, settings, event("call.ringing", timestamp=future)).status_code == 400
    assert send(client, settings, event("call.ringing", timestamp=utcnow().isoformat())).status_code == 200


def test_call_recordings_must_be_web_links(client: TestClient, auth: Headers) -> None:
    settings = setup(client, auth)
    assert send(client, settings, event("call.ended", recording_url="javascript:alert(1)", duration=5)).status_code == 400
