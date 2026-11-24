"""Thin client for the Meta Graph API (Instagram messaging through a Facebook Page token, and lead ads).

Kept separate so tests and the simulator never reach Meta: they patch these three functions.
"""

import logging
from typing import Any

import httpx

from app.core.errors import DomainError

GRAPH = "https://graph.facebook.com/v21.0"
log = logging.getLogger(__name__)


def _get(path: str, token: str, fields: str) -> dict[str, Any] | None:
    try:
        response = httpx.get(f"{GRAPH}/{path}", params={"fields": fields, "access_token": token}, timeout=10)
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]
    except httpx.HTTPError as error:
        # Enrichment is best effort: the lead is still created from what the webhook carried.
        log.warning("Graph API read %s failed: %s", path, error)
        return None


def fetch_profile(token: str, user_id: str) -> dict[str, Any] | None:
    """Name and username of an Instagram user who messaged the account."""
    return _get(user_id, token, "name,username")


def fetch_lead(token: str, leadgen_id: str) -> dict[str, Any] | None:
    """Answers of a submitted lead form, with the ad and form it came from."""
    return _get(leadgen_id, token, "field_data,ad_id,form_id,created_time")


def send_message(token: str, recipient_id: str, text: str) -> str:
    """Sends a Direct reply; returns Meta's message id."""
    try:
        response = httpx.post(f"{GRAPH}/me/messages", params={"access_token": token},
                              json={"recipient": {"id": recipient_id}, "message": {"text": text}}, timeout=10)
        response.raise_for_status()
    except httpx.HTTPError as error:
        log.warning("Graph API send failed: %s", error)
        raise DomainError("Instagram did not accept the message", "instagram_send_failed") from error
    return str(response.json().get("message_id", ""))
