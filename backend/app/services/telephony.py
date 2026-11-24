"""Automatic call capture: PBX webhook → matched, linked, idempotent call activity → real-time event."""

import hashlib
import hmac

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import NotFound, Unauthorized
from app.models import Activity, Company, Contact, Deal, TelephonyIntegration, Workspace
from app.models.telephony import new_token
from app.schemas.crm import ActivityOut
from app.schemas.telephony import CallEventOut, TelephonyEventIn
from app.services import billing
from app.services.events import broker
from app.services.phone_match import create_caller_contact, find_contact, latest_open_deal

PROVIDER_OUTCOME = {"answered": "connected", "no_answer": "no_answer", "busy": "busy", "voicemail": "voicemail", "failed": "wrong_number"}
LIVE_EVENTS = {"call.ringing": "ringing", "call.answered": "answered"}


# ───────────── Integration settings & security ─────────────

def integration_for(db: Session, workspace_id: str) -> TelephonyIntegration:
    integration = db.scalar(select(TelephonyIntegration).where(TelephonyIntegration.workspace_id == workspace_id))
    if integration is None:
        integration = TelephonyIntegration(workspace_id=workspace_id)
        db.add(integration)
        db.commit()
    return integration


def integration_by_token(db: Session, token: str) -> TelephonyIntegration:
    integration = db.scalar(select(TelephonyIntegration).where(TelephonyIntegration.webhook_token == token))
    if integration is None:
        raise NotFound("Unknown webhook", "not_found")
    # A closed company stops receiving calls too (the PBX keeps retrying until it is paid again).
    billing.ensure_open(db.get(Workspace, integration.workspace_id))  # type: ignore[arg-type]
    return integration


def rotate(db: Session, integration: TelephonyIntegration) -> TelephonyIntegration:
    integration.webhook_token, integration.signing_secret = new_token(), new_token()
    db.commit()
    return integration


def sign(secret: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def verify_signature(secret: str, body: bytes, header: str | None) -> None:
    if not header or not hmac.compare_digest(sign(secret, body), header):
        raise Unauthorized("Invalid webhook signature", "invalid_signature")


# ───────────── Call pipeline ─────────────

def _find_call(db: Session, workspace_id: str, call_id: str) -> Activity | None:
    return db.scalar(select(Activity).where(Activity.workspace_id == workspace_id, Activity.external_id == call_id))


def _identify(db: Session, integration: TelephonyIntegration, phone: str) -> Contact | None:
    contact = find_contact(db, integration.workspace_id, phone)
    if contact is None and integration.create_unknown_contacts:
        contact = create_caller_contact(db, integration.workspace_id, phone)
    return contact


def _call_owner(db: Session, contact: Contact | None, deal: Deal | None) -> str | None:
    """The rep who owns the relationship owns the call, so it shows up in their own-scope lists."""
    company = db.get(Company, contact.company_id) if contact and contact.company_id else None
    return next((o for o in (contact and contact.owner_id, deal and deal.owner_id, company and company.owner_id) if o), None)


def _new_call(db: Session, integration: TelephonyIntegration, event: TelephonyEventIn) -> Activity:
    contact = _identify(db, integration, event.customer_phone)
    deal = latest_open_deal(db, contact) if contact else None
    name = f"{contact.first_name} {contact.last_name}".strip() if contact else event.customer_phone
    call = Activity(
        workspace_id=integration.workspace_id, type="call", subject=f"{event.direction.title()} call · {name}",
        due_at=event.timestamp or utcnow(), done=False, auto_logged=True, external_id=event.call_id,
        call_direction=event.direction, phone=event.customer_phone,
        contact_id=contact.id if contact else None, company_id=contact.company_id if contact else None,
        deal_id=deal.id if deal else None, owner_id=_call_owner(db, contact, deal),
    )
    db.add(call)
    db.flush()
    return call


def _outcome(event: TelephonyEventIn) -> str:
    if event.status:
        return PROVIDER_OUTCOME[event.status]
    return "connected" if event.event == "call.ended" and event.duration > 0 else "no_answer"


def _callback_task(call: Activity) -> Activity:
    now = utcnow()
    return Activity(
        workspace_id=call.workspace_id, type="task", subject=f"Call back {call.phone}", due_at=now, remind_at=now,
        contact_id=call.contact_id, company_id=call.company_id, deal_id=call.deal_id, owner_id=call.owner_id,
    )


def _finish(db: Session, integration: TelephonyIntegration, call: Activity, event: TelephonyEventIn) -> None:
    call.done, call.call_outcome = True, _outcome(event)
    call.duration_seconds = event.duration
    call.recording_url = event.recording_url or call.recording_url
    missed = call.call_direction == "inbound" and call.call_outcome != "connected"
    if missed and integration.callback_task_on_missed:
        db.add(_callback_task(call))


def _publish(db: Session, call: Activity, kind: str) -> None:
    contact = db.get(Contact, call.contact_id) if call.contact_id else None
    company = db.get(Company, call.company_id) if call.company_id else None
    deal = db.get(Deal, call.deal_id) if call.deal_id else None
    event = CallEventOut(
        type=kind, call=ActivityOut.model_validate(call),  # type: ignore[arg-type]
        contact_name=f"{contact.first_name} {contact.last_name}".strip() if contact else None,
        company_name=company.name if company else None, deal_title=deal.title if deal else None,
    )
    broker.publish(call.workspace_id, event.model_dump(mode="json"))


def ingest(db: Session, integration: TelephonyIntegration, event: TelephonyEventIn) -> Activity:
    """Idempotent: providers retry webhooks, so every event is keyed by the provider's call id."""
    call = _find_call(db, integration.workspace_id, event.call_id)
    if call is not None and call.done:
        return call
    call = call or _new_call(db, integration, event)
    if event.event in LIVE_EVENTS:
        kind = LIVE_EVENTS[event.event]
    else:
        kind = "ended"
        _finish(db, integration, call, event)
    db.commit()
    db.refresh(call)
    _publish(db, call, kind)
    return call
