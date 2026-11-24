"""Instagram channel: Meta webhooks in (Direct messages, lead ads), replies out. Meta payload formats:
https://developers.facebook.com/docs/messenger-platform/instagram/features/webhook and .../marketing-api/guides/lead-ads
"""

import hashlib
import hmac
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import Conflict, NotFound, Unauthorized
from app.models import Activity, Contact, InstagramIntegration, Workspace
from app.models.instagram import new_token
from app.services import billing, instagram_graph as graph
from app.services.instagram_leads import contact_by_instagram, lead_for, matching_contact, message_activity, new_contact, open_lead

# Meta lets a business reply for 24 hours after the customer's last message.
REPLY_WINDOW = timedelta(hours=24)
SIMULATED = "sim-"


def integration_for(db: Session, workspace_id: str) -> InstagramIntegration:
    integration = db.scalar(select(InstagramIntegration).where(InstagramIntegration.workspace_id == workspace_id))
    if integration is None:
        integration = InstagramIntegration(workspace_id=workspace_id)
        db.add(integration)
        db.commit()
    return integration


def integration_by_token(db: Session, token: str) -> InstagramIntegration:
    integration = db.scalar(select(InstagramIntegration).where(InstagramIntegration.webhook_token == token))
    if integration is None:
        raise NotFound("Unknown webhook", "not_found")
    billing.ensure_open(db.get(Workspace, integration.workspace_id))  # type: ignore[arg-type]
    return integration


def rotate(db: Session, integration: InstagramIntegration) -> None:
    integration.webhook_token, integration.verify_token = new_token(), new_token()
    db.commit()


def verify_signature(integration: InstagramIntegration, body: bytes, header: str | None) -> None:
    """Meta signs every delivery with the app secret: X-Hub-Signature-256: sha256=<hex>."""
    if not integration.app_secret or not header or not header.startswith("sha256="):
        raise Unauthorized("Missing webhook signature", "invalid_signature")
    expected = hmac.new(integration.app_secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, header.removeprefix("sha256=")):
        raise Unauthorized("Invalid webhook signature", "invalid_signature")


def _when(ms: int | None) -> datetime:
    return datetime.fromtimestamp(ms / 1000, UTC) if ms else utcnow()


def _person(db: Session, integration: InstagramIntegration, user_id: str) -> Contact:
    """The customer behind an Instagram-scoped id; a first message opens a lead and a deal."""
    contact = contact_by_instagram(db, integration.workspace_id, user_id)
    if contact:
        return contact
    profile = graph.fetch_profile(integration.access_token, user_id) if integration.access_token and not user_id.startswith(SIMULATED) else None
    username = (profile or {}).get("username")
    name = (profile or {}).get("name") or (f"@{username}" if username else f"Instagram {user_id[-6:]}")
    first, _, last = name.partition(" ")
    contact = new_contact(db, integration, first, last, instagram_id=user_id, instagram_username=username)
    open_lead(db, integration, contact, "message", user_id)
    return contact


def handle_message(db: Session, integration: InstagramIntegration, event: dict[str, Any]) -> Activity | None:
    message = event.get("message") or {}
    mid, text = message.get("mid"), message.get("text") or ("📎" if message.get("attachments") else "")
    if not mid or db.scalar(select(Activity.id).where(Activity.workspace_id == integration.workspace_id, Activity.external_id == mid)):
        return None  # not a message (reads, reactions) or a repeated delivery
    # An echo is the business replying from the Instagram app: it belongs to the customer's thread as outbound.
    echo = bool(message.get("is_echo"))
    customer = event["recipient"]["id"] if echo else event["sender"]["id"]
    contact = _person(db, integration, customer)
    lead, at = lead_for(db, integration.workspace_id, contact.id), _when(event.get("timestamp"))
    if echo and lead and lead.first_response_at is None:
        lead.first_response_at = at
    activity = message_activity(contact, lead, text, "outbound" if echo else "inbound", mid, at)
    db.add(activity)
    return activity


def handle_lead(db: Session, integration: InstagramIntegration, value: dict[str, Any]) -> Activity | None:
    leadgen_id = str(value.get("leadgen_id") or "")
    if not leadgen_id or db.scalar(select(Activity.id).where(Activity.workspace_id == integration.workspace_id, Activity.external_id == f"lead:{leadgen_id}")):
        return None
    detail = value if "field_data" in value else (graph.fetch_lead(integration.access_token, leadgen_id) if integration.access_token else None) or {}
    answers = {f["name"]: (f.get("values") or [""])[0] for f in detail.get("field_data", [])}
    name = answers.get("full_name") or " ".join(filter(None, [answers.get("first_name"), answers.get("last_name")])) or "Instagram lead"
    phone, email = answers.get("phone_number"), (answers.get("email") or "").lower() or None
    contact = matching_contact(db, integration, phone, email)
    if contact is None:
        first, _, last = name.partition(" ")
        contact = new_contact(db, integration, first, last, phone=phone, email=email)
    lead = open_lead(db, integration, contact, "lead_form", leadgen_id, detail.get("ad_id") or value.get("ad_id"), detail.get("form_id") or value.get("form_id"))
    body = "\n".join(f"{k}: {v}" for k, v in answers.items())
    activity = Activity(workspace_id=contact.workspace_id, owner_id=contact.owner_id, type="note", subject="Instagram lead form", body=body,
                        external_id=f"lead:{leadgen_id}", contact_id=contact.id, deal_id=lead.deal_id, auto_logged=True, channel="instagram")
    db.add(activity)
    return activity


def ingest(db: Session, integration: InstagramIntegration, payload: dict[str, Any]) -> int:
    """Processes one webhook delivery; returns how many messages / leads were new."""
    created = 0
    for entry in payload.get("entry", []):
        for event in entry.get("messaging", []) if payload.get("object") == "instagram" else []:
            created += handle_message(db, integration, event) is not None
        for change in entry.get("changes", []):
            if change.get("field") == "leadgen":
                created += handle_lead(db, integration, change.get("value") or {}) is not None
    integration.last_event_at = utcnow()
    db.commit()
    return created


def reply(db: Session, integration: InstagramIntegration, contact: Contact, text: str, owner_id: str) -> Activity:
    if not contact.instagram_id:
        raise Conflict("This contact did not come from Instagram", "not_instagram_contact")
    last_in = db.scalar(select(Activity.due_at).where(Activity.contact_id == contact.id, Activity.type == "message", Activity.call_direction == "inbound")
                        .order_by(Activity.due_at.desc()).limit(1))
    if last_in is None or utcnow() - last_in > REPLY_WINDOW:
        raise Conflict("Instagram allows replies only within 24 hours of the customer's last message", "messaging_window_closed")
    simulated = contact.instagram_id.startswith(SIMULATED)
    if not simulated and not integration.access_token:
        raise Conflict("Connect Instagram in Settings first", "instagram_not_connected")
    mid = f"{SIMULATED}{new_token()}" if simulated else graph.send_message(integration.access_token or "", contact.instagram_id, text)
    lead = lead_for(db, integration.workspace_id, contact.id)
    activity = message_activity(contact, lead, text, "outbound", mid, utcnow())
    activity.owner_id = owner_id
    if lead and lead.first_response_at is None:
        lead.first_response_at = utcnow()
    db.add(activity)
    db.commit()
    return activity


def simulate(db: Session, integration: InstagramIntegration, kind: str, name: str, username: str | None, text: str,
             phone: str | None, email: str | None, ad_id: str | None) -> int:
    """The same ingest as a real webhook, with payloads shaped like Meta's (ids prefixed so nothing is sent to Meta)."""
    now_ms = int(utcnow().timestamp() * 1000)
    if kind == "lead_form":
        fields = [{"name": k, "values": [v]} for k, v in {"full_name": name, "phone_number": phone, "email": email}.items() if v]
        value = {"leadgen_id": f"{SIMULATED}{new_token()}", "form_id": f"{SIMULATED}form", "ad_id": ad_id, "field_data": fields}
        return ingest(db, integration, {"object": "page", "entry": [{"changes": [{"field": "leadgen", "value": value}]}]})
    sender = f"{SIMULATED}{(username or name).lower().replace(' ', '-')}"[:64]
    if contact_by_instagram(db, integration.workspace_id, sender) is None:
        first, _, last = name.partition(" ")
        contact = new_contact(db, integration, first, last, instagram_id=sender, instagram_username=username)
        open_lead(db, integration, contact, "message", sender, ad_id=ad_id)
    event = {"sender": {"id": sender}, "recipient": {"id": f"{SIMULATED}account"}, "timestamp": now_ms,
             "message": {"mid": f"{SIMULATED}{new_token()}", "text": text}}
    return ingest(db, integration, {"object": "instagram", "entry": [{"messaging": [event]}]})
