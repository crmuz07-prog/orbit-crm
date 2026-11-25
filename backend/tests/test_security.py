"""Security hardening: stream tickets, headers, production guards, rate limits, CSV escaping, URL schemes, zip bombs."""

import io
import zipfile

import pytest
from fastapi.testclient import TestClient

from app.core import rate_limit
from app.core.config import Settings, get_settings
from app.core.security import create_access_token, create_stream_ticket, decode_access_token, decode_stream_ticket
from app.core.errors import BadRequest
from app.services.export import safe_cell
from app.services.importer.reader import ensure_reasonable_zip
from tests.conftest import Headers


def test_a_stream_ticket_is_not_a_session_token_and_a_session_token_opens_no_stream() -> None:
    ticket = create_stream_ticket("u1", "w1", 0)
    session = create_access_token("u1", "w1", 0)
    assert decode_access_token(ticket) is None and decode_stream_ticket(ticket) is not None
    assert decode_stream_ticket(session) is None and decode_access_token(session) is not None


def test_the_stream_takes_tickets_only(client: TestClient, auth: Headers) -> None:
    session = auth["Authorization"].removeprefix("Bearer ")
    assert client.get(f"/api/telephony/stream?ticket={session}").status_code == 401
    ticket = client.post("/api/telephony/stream-ticket", headers=auth).json()["ticket"]
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {ticket}"}).status_code == 401


def test_security_headers(client: TestClient) -> None:
    headers = client.get("/api/health").headers
    assert headers["x-content-type-options"] == "nosniff" and headers["x-frame-options"] == "DENY"
    assert headers["cache-control"] == "no-store" and "frame-ancestors 'none'" in headers["content-security-policy"]


def test_production_refuses_a_weak_secret_and_hides_docs_and_localhost_origins() -> None:
    prod = Settings(database_url="postgresql://x/y", jwt_secret="change-me-in-production")
    with pytest.raises(RuntimeError):
        prod.check_production()
    Settings(database_url="postgresql://x/y", jwt_secret="x" * 40).check_production()
    Settings(jwt_secret="short").check_production()  # local SQLite: allowed
    origins = Settings(database_url="postgresql://x/y", frontend_url="https://app.example", cors_origin_regex=".*").cors_origin_list
    assert origins == ["https://app.example"]
    assert Settings(database_url="postgresql://x/y", cors_origin_regex=".*").cors_regex is None


def test_recovery_endpoints_are_rate_limited(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "rate_limit_enabled", True)
    rate_limit.reset()
    codes = [client.post("/api/auth/forgot", json={"email": "a@b.uz"}).status_code for _ in range(11)]
    assert codes[:10] == [204] * 10 and codes[10] == 429
    assert client.post("/api/auth/forgot", json={"email": "a@b.uz"}).json()["code"] == "too_many_requests"
    rate_limit.reset()


def test_spreadsheet_formulas_are_kept_as_text() -> None:
    assert safe_cell('=HYPERLINK("http://x","y")') == '\'=HYPERLINK("http://x","y")'
    assert safe_cell("+998 90 123") == "'+998 90 123" and safe_cell("Ali") == "Ali" and safe_cell(5) == 5


def test_links_must_be_web_addresses(client: TestClient, auth: Headers) -> None:
    bad = client.post("/api/contacts", headers=auth, json={"first_name": "A", "linkedin_url": "javascript:alert(1)"})
    assert bad.status_code == 422
    good = client.post("/api/contacts", headers=auth, json={"first_name": "A", "linkedin_url": "https://linkedin.com/in/a"}).json()
    assert client.patch(f"/api/contacts/{good['id']}", headers=auth, json={"linkedin_url": "data:text/html,x"}).status_code == 422
    assert client.patch(f"/api/stages/{client.get('/api/stages', headers=auth).json()[0]['id']}", headers=auth, json={"probability": 500}).status_code == 422


def test_zip_bombs_are_refused_before_parsing() -> None:
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("xl/worksheets/sheet1.xml", b"0" * (90 * 1024 * 1024))
    with pytest.raises(BadRequest):
        ensure_reasonable_zip(out.getvalue())
