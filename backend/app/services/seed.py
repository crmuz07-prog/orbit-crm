"""Generates a realistic, deterministic sample workspace (accounts → people → deals → activities)."""

import random
import re
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Activity, Company, Contact, Deal, Stage
from app.services import sample_data as data
from app.services.onboarding import default_stages


def ensure_stages(db: Session, workspace_id: str) -> list[Stage]:
    stages = list(db.scalars(select(Stage).where(Stage.workspace_id == workspace_id).order_by(Stage.position)))
    if not stages:
        stages = default_stages(workspace_id)
        db.add_all(stages)
        db.flush()
    return stages


def build_companies(workspace_id: str, rng: random.Random, now: datetime) -> list[Company]:
    return [
        Company(
            workspace_id=workspace_id, name=name, domain=domain, industry=industry, employees=employees,
            country=country, city=city, annual_revenue=revenue, lifecycle=lifecycle,
            description=f"{industry} company headquartered in {city}, {country}.",
            created_at=now - timedelta(days=rng.randint(60, 240)),
        )
        for name, domain, industry, employees, country, city, revenue, lifecycle in data.COMPANIES
    ]


def build_contacts(companies: list[Company], rng: random.Random) -> list[Contact]:
    contacts: list[Contact] = []
    for company in companies:
        for _ in range(rng.randint(1, 3)):
            i = len(contacts)
            first, last = data.FIRST_NAMES[i % 20], data.LAST_NAMES[(i * 7 + 3) % 20]
            handle = re.sub(r"[^a-z.]", "", f"{first}.{last}".lower())
            contacts.append(Contact(
                workspace_id=company.workspace_id, company_id=company.id, first_name=first, last_name=last,
                title=rng.choice(data.TITLES), email=f"{handle}@{company.domain}",
                phone=f"+{rng.randint(1, 99)} {rng.randint(100, 999)} {rng.randint(100, 999)} {rng.randint(1000, 9999)}",
                created_at=company.created_at,
            ))
    return contacts


def pick_stage(stages: list[Stage], rng: random.Random) -> Stage:
    roll = rng.random()
    won = next(s for s in stages if s.is_won)
    lost = next(s for s in stages if s.is_lost)
    return won if roll < 0.22 else lost if roll < 0.36 else rng.choice([s for s in stages if not s.is_closed])


def build_deal(company: Company, contacts: list[Contact], stages: list[Stage], rng: random.Random, now: datetime) -> Deal:
    stage = pick_stage(stages, rng)
    # Closed deals spread over ~6 months with a 2–10 week cycle; some open deals are left idle ("rotting").
    closed_at = now - timedelta(days=int(rng.triangular(1, 170, 15))) if stage.is_closed else None
    created_at = closed_at - timedelta(days=rng.randint(14, 70)) if closed_at else now - timedelta(days=rng.randint(10, 120))
    idle_days = 0 if closed_at else rng.randint(15, 40) if rng.randint(1, 100) <= 15 else rng.randint(0, 9)
    people = [c for c in contacts if c.company_id == company.id]
    return Deal(
        workspace_id=company.workspace_id, title=f"{company.name} — {rng.choice(data.PRODUCTS)}",
        company_id=company.id, contact_id=rng.choice(people).id if people else None, stage_id=stage.id,
        amount=rng.randint(8, 240) * 1000, priority=rng.choice(data.PRIORITIES), source=rng.choice(data.SOURCES),
        expected_close_date=(closed_at or now + timedelta(days=rng.randint(-12, 90))).date(),
        lost_reason=rng.choice(data.LOST_REASONS) if stage.is_lost else None,
        closed_at=closed_at, created_at=created_at, updated_at=max(now - timedelta(days=idle_days), created_at),
    )


def call_fields(rng: random.Random, contact: Contact | None) -> dict[str, object]:
    outcome = rng.choice(data.CALL_OUTCOMES)
    summary, next_steps = rng.choice(data.CALL_NOTES)
    connected = outcome == "connected"
    return {
        "call_direction": "inbound" if rng.random() < 0.2 else "outbound", "call_outcome": outcome,
        "duration_seconds": rng.randint(120, 1800) if connected else rng.randint(0, 40),
        "phone": contact.phone if contact else None,
        "body": summary if connected else None, "next_steps": next_steps if connected else None,
    }


def build_activity(deal: Deal, contact: Contact | None, rng: random.Random, now: datetime) -> Activity:
    kind, subject, body = rng.choice(data.ACTIVITIES)
    offset = rng.randint(-6, 10)
    if kind == "call" and offset > 0:  # a future call is a scheduled task, not a call log
        kind, subject = "task", f"Call back: {subject}"
    due = None if kind == "note" else (now + timedelta(days=offset)).replace(hour=rng.randint(9, 17), minute=0, second=0)
    is_call = kind == "call" and offset <= 0
    activity = Activity(
        workspace_id=deal.workspace_id, type=kind, subject=subject, body=body, due_at=due,
        done=is_call or (due is not None and (offset < -2 or (offset < 0 and rng.random() < 0.5))),
        pinned=kind == "note" and rng.random() < 0.3,
        deal_id=deal.id, company_id=deal.company_id, contact_id=deal.contact_id,
        created_at=now - timedelta(days=rng.randint(0, 30)),
    )
    if is_call:
        for field, value in call_fields(rng, contact).items():
            setattr(activity, field, value)
    elif kind in ("task", "meeting") and due and not activity.done and offset <= 2:
        activity.remind_at = due - timedelta(minutes=15)
    return activity


def build_call(deal: Deal, contact: Contact | None, rng: random.Random, now: datetime) -> Activity:
    """A logged call in the last three weeks during business hours (some of them today)."""
    if rng.random() < 0.15:
        called_at = now - timedelta(minutes=rng.randint(20, 480))
    else:
        called_at = (now - timedelta(days=rng.randint(1, 21))).replace(hour=rng.randint(9, 17), minute=rng.choice([0, 15, 30, 45]), second=0)
    name = contact.first_name if contact else "client"
    return Activity(
        workspace_id=deal.workspace_id, type="call", subject=f"Call with {name}", due_at=called_at, done=True,
        deal_id=deal.id, company_id=deal.company_id, contact_id=deal.contact_id, created_at=called_at,
        **call_fields(rng, contact),
    )


def build_activities(deal: Deal, contacts: dict[str, Contact], rng: random.Random, now: datetime) -> list[Activity]:
    contact = contacts.get(deal.contact_id or "")
    calls = [build_call(deal, contact, rng, now) for _ in range(rng.randint(0, 3))]
    return calls + [build_activity(deal, contact, rng, now) for _ in range(rng.randint(1, 4))]


def seed_workspace(db: Session, workspace_id: str, seed: int = 42) -> None:
    rng, now = random.Random(seed), utcnow()
    stages = ensure_stages(db, workspace_id)
    companies = build_companies(workspace_id, rng, now)
    db.add_all(companies)
    db.flush()
    contacts = build_contacts(companies, rng)
    db.add_all(contacts)
    db.flush()
    deals = [build_deal(c, contacts, stages, rng, now) for c in companies for _ in range(rng.randint(2, 4))]
    db.add_all(deals)
    db.flush()
    by_id = {c.id: c for c in contacts}
    db.add_all([a for d in deals for a in build_activities(d, by_id, rng, now)])
    db.commit()


def wipe_workspace(db: Session, workspace_id: str) -> None:
    for model in (Activity, Deal, Contact, Company, Stage):
        db.execute(delete(model).where(model.workspace_id == workspace_id))
    db.commit()
