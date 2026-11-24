"""Call logging and calling analytics (Close.com / Aircall style)."""

from datetime import datetime, timedelta
from typing import get_args

from sqlalchemy import ColumnElement, or_, select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Activity, Company, Contact, Deal
from app.schemas.calls import CallLogIn, CallStatsOut, OutcomeCount
from app.schemas.crm import CallOutcome
from app.services.crud import assert_references

CALL_REFERENCES = {"deal_id": Deal, "company_id": Company, "contact_id": Contact}


def _links(data: CallLogIn) -> dict[str, str | None]:
    return {"deal_id": data.deal_id, "company_id": data.company_id, "contact_id": data.contact_id}


def _call_activity(workspace_id: str, data: CallLogIn) -> Activity:
    return Activity(
        workspace_id=workspace_id, type="call", subject=data.subject, body=data.summary,
        due_at=data.called_at or utcnow(), done=True, call_direction=data.direction,
        call_outcome=data.outcome, duration_seconds=data.duration_seconds, phone=data.phone,
        next_steps=data.next_steps, **_links(data),
    )


def _follow_up_task(workspace_id: str, data: CallLogIn) -> Activity | None:
    if data.follow_up is None:
        return None
    return Activity(
        workspace_id=workspace_id, type="task", subject=data.follow_up.subject, body=data.next_steps,
        due_at=data.follow_up.due_at, remind_at=data.follow_up.remind_at, **_links(data),
    )


def log_call(db: Session, workspace_id: str, owner_id: str, data: CallLogIn) -> tuple[Activity, Activity | None]:
    """Saves the call and its optional follow-up task (both owned by the caller) in one transaction."""
    assert_references(db, workspace_id, _links(data), CALL_REFERENCES)
    call, follow_up = _call_activity(workspace_id, data), _follow_up_task(workspace_id, data)
    for activity in (call, follow_up):
        if activity:
            activity.owner_id = owner_id
    db.add_all([a for a in (call, follow_up) if a])
    db.commit()
    return call, follow_up


def _calls_between(db: Session, workspace_id: str, visible: ColumnElement[bool], since: datetime, until: datetime) -> list[Activity]:
    """Logged (completed) calls only — a scheduled future call is not a conversation yet."""
    query = select(Activity).where(
        Activity.workspace_id == workspace_id, Activity.type == "call", Activity.done.is_(True),
        Activity.due_at >= since, Activity.due_at <= until, visible,
    )
    return list(db.scalars(query))


def call_stats(db: Session, workspace_id: str, visible: ColumnElement[bool]) -> CallStatsOut:
    now = utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week = _calls_between(db, workspace_id, visible, day_start - timedelta(days=day_start.weekday()), now)
    logged = _calls_between(db, workspace_id, visible, now - timedelta(days=30), now)
    connected = [c for c in logged if c.call_outcome == "connected"]
    talk_time = sum(c.duration_seconds or 0 for c in connected)
    return CallStatsOut(
        today=sum(1 for c in week if c.due_at and c.due_at >= day_start),
        this_week=len(week),
        connect_rate=len(connected) / len(logged) * 100 if logged else 0,
        avg_duration_seconds=round(talk_time / len(connected)) if connected else 0,
        talk_time_seconds=talk_time,
        by_outcome=[OutcomeCount(outcome=o, count=sum(1 for c in logged if c.call_outcome == o)) for o in get_args(CallOutcome)],
    )


def pending_reminders(db: Session, workspace_id: str, user_id: str) -> list[Activity]:
    """My reminders only (plus unowned ones) — like HubSpot task reminders, nobody is pinged for a colleague's task."""
    mine = or_(Activity.owner_id == user_id, Activity.owner_id.is_(None))
    query = (
        select(Activity)
        .where(Activity.workspace_id == workspace_id, Activity.remind_at.is_not(None), Activity.done.is_(False), mine)
        .order_by(Activity.remind_at)
        .limit(50)
    )
    return list(db.scalars(query))
