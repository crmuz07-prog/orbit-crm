"""Turning an Instagram person into CRM records: contact, open deal in the configured stage, and the lead entry."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Activity, Contact, Deal, InboundLead, InstagramIntegration, Pipeline, Stage
from app.services import history
from app.services.phone_match import find_contact

SOURCE = "Instagram"


def target_stage(db: Session, integration: InstagramIntegration) -> Stage | None:
    """The configured stage, else the first open stage of the default pipeline."""
    stage = db.get(Stage, integration.stage_id) if integration.stage_id else None
    if stage and stage.workspace_id == integration.workspace_id:
        return stage
    pipeline = db.scalar(select(Pipeline).where(Pipeline.workspace_id == integration.workspace_id).order_by(Pipeline.is_default.desc(), Pipeline.position))
    if pipeline is None:
        return None
    query = select(Stage).where(Stage.pipeline_id == pipeline.id, Stage.is_won.is_(False), Stage.is_lost.is_(False)).order_by(Stage.position)
    return db.scalars(query).first()


def contact_by_instagram(db: Session, workspace_id: str, instagram_id: str) -> Contact | None:
    return db.scalar(select(Contact).where(Contact.workspace_id == workspace_id, Contact.instagram_id == instagram_id))


def new_contact(db: Session, integration: InstagramIntegration, first_name: str, last_name: str = "", **fields: str | None) -> Contact:
    contact = Contact(workspace_id=integration.workspace_id, owner_id=integration.owner_id, first_name=first_name[:80] or SOURCE,
                      last_name=last_name[:80], **fields)
    db.add(contact)
    db.flush()
    history.created(db, contact, None)
    return contact


def matching_contact(db: Session, integration: InstagramIntegration, phone: str | None, email: str | None) -> Contact | None:
    """A lead-form person who already exists (same phone or e-mail) is not duplicated."""
    if phone and (found := find_contact(db, integration.workspace_id, phone)):
        return found
    if email:
        return db.scalar(select(Contact).where(Contact.workspace_id == integration.workspace_id, Contact.email == email.lower()))
    return None


def open_lead(db: Session, integration: InstagramIntegration, contact: Contact, kind: str, external_id: str,
              ad_id: str | None = None, form_id: str | None = None, at: datetime | None = None) -> InboundLead:
    """The lead entry plus an open deal for it (amoCRM "incoming lead" → first stage)."""
    stage = target_stage(db, integration)
    deal = None
    if stage:
        name = f"{contact.first_name} {contact.last_name}".strip()
        deal = Deal(workspace_id=integration.workspace_id, owner_id=integration.owner_id, title=f"{SOURCE} · {name}"[:200],
                    contact_id=contact.id, stage_id=stage.id, source=SOURCE, stage_entered_at=utcnow())
        db.add(deal)
        db.flush()
        history.created(db, deal, None)
    lead = InboundLead(workspace_id=integration.workspace_id, kind=kind, external_id=external_id, contact_id=contact.id,
                       deal_id=deal.id if deal else None, ad_id=ad_id, form_id=form_id, created_at=at or utcnow())
    db.add(lead)
    # The app's sessions don't autoflush: the next lookup (lead_for) must already see this lead.
    db.flush()
    return lead


def lead_for(db: Session, workspace_id: str, contact_id: str) -> InboundLead | None:
    query = select(InboundLead).where(InboundLead.workspace_id == workspace_id, InboundLead.contact_id == contact_id)
    return db.scalars(query.order_by(InboundLead.created_at.desc())).first()


def message_activity(contact: Contact, lead: InboundLead | None, text: str, direction: str, mid: str | None, at: datetime) -> Activity:
    preview = text.strip().splitlines()[0][:120] if text.strip() else "Instagram"
    return Activity(
        workspace_id=contact.workspace_id, owner_id=contact.owner_id, type="message", channel="instagram", subject=preview, body=text,
        call_direction=direction, external_id=mid, done=True, due_at=at, contact_id=contact.id,
        deal_id=lead.deal_id if lead else None, auto_logged=True, created_at=at,
    )
