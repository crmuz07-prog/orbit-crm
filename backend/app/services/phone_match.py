"""Phone-number normalisation and caller identification."""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Contact, Deal, Stage

# National significant number length for Uzbekistan (and close enough for most of CIS/EU matching).
MATCH_DIGITS = 9


def digits(raw: str | None) -> str:
    return re.sub(r"\D", "", raw or "")


def phone_key(raw: str | None) -> str:
    """Last N digits: "+998 90 123-45-67", "998901234567" and "90 123 45 67" all match."""
    return digits(raw)[-MATCH_DIGITS:]


def find_contact(db: Session, workspace_id: str, phone: str) -> Contact | None:
    key = phone_key(phone)
    if len(key) < 7:
        return None
    query = select(Contact).where(Contact.workspace_id == workspace_id, Contact.phone.is_not(None))
    # Fine for a single workspace's contacts; add an indexed normalised column when lists grow large.
    return next((c for c in db.scalars(query) if phone_key(c.phone) == key), None)


def create_caller_contact(db: Session, workspace_id: str, phone: str) -> Contact:
    contact = Contact(workspace_id=workspace_id, first_name=phone, last_name="", phone=phone, title=None, created_at=utcnow())
    db.add(contact)
    db.flush()
    return contact


def latest_open_deal(db: Session, contact: Contact) -> Deal | None:
    query = (
        select(Deal)
        .join(Stage, Stage.id == Deal.stage_id)
        .where(Deal.contact_id == contact.id, Stage.is_won.is_(False), Stage.is_lost.is_(False))
        .order_by(Deal.updated_at.desc())
    )
    return db.scalars(query).first()
