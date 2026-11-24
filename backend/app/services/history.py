"""Record history: who created or changed what (the system lines of the record feed) and time spent in stages."""

from collections import defaultdict
from datetime import date, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Company, Contact, Deal, RecordEvent
from app.models.base import OwnedMixin

LINK = {Deal: "deal_id", Company: "company_id", Contact: "contact_id"}
# Bookkeeping fields that are not worth a line in the feed.
SILENT = {"closed_at", "stage_entered_at", "updated_at"}


def plain(value: Any) -> Any:
    """JSON-friendly values for the change log."""
    return value.isoformat() if isinstance(value, (date, datetime)) else value


def snapshot(row: OwnedMixin, fields: set[str]) -> dict[str, Any]:
    return {f: plain(getattr(row, f)) for f in fields}


def record(db: Session, row: OwnedMixin, actor_id: str | None, kind: str, changes: Any) -> None:
    link = LINK.get(type(row))  # type: ignore[call-overload]
    if link is None:
        return
    db.add(RecordEvent(workspace_id=row.workspace_id, actor_id=actor_id, kind=kind, changes=changes, **{link: row.id}))
    db.commit()


def created(db: Session, row: OwnedMixin, actor_id: str | None) -> None:
    changes = {"stage_id": row.stage_id} if isinstance(row, Deal) else {}
    record(db, row, actor_id, "created", changes)


def updated(db: Session, row: OwnedMixin, actor_id: str | None, before: dict[str, Any]) -> None:
    """One event for the stage move (if any) and one with the other field changes."""
    after = snapshot(row, set(before))
    diff = {f: (before[f], after[f]) for f in before if before[f] != after[f] and f not in SILENT}
    stage = diff.pop("stage_id", None)
    if stage:
        record(db, row, actor_id, "stage_changed", {"from": stage[0], "to": stage[1]})
    if diff:
        record(db, row, actor_id, "updated", [{"field": f, "old": old, "new": new} for f, (old, new) in diff.items()])


def events_for(db: Session, workspace_id: str, link: str, record_id: str) -> list[RecordEvent]:
    query = select(RecordEvent).where(RecordEvent.workspace_id == workspace_id, getattr(RecordEvent, link) == record_id)
    return list(db.scalars(query.order_by(RecordEvent.created_at)))


def stage_segments(deal: Deal, events: list[RecordEvent]) -> list[tuple[str, datetime, datetime]]:
    """(stage, entered, left) intervals; the current stage runs until now."""
    moves = [e for e in events if e.kind == "stage_changed"]
    first = next((e.changes.get("stage_id") for e in events if e.kind == "created"), None)
    stage = first or (moves[0].changes["from"] if moves else deal.stage_id)
    start = next((e.created_at for e in events if e.kind == "created"), deal.created_at)
    segments = []
    for move in moves:
        segments.append((stage, start, move.created_at))
        stage, start = move.changes["to"], move.created_at
    segments.append((stage, start, utcnow()))
    return segments


def stage_times(deal: Deal, events: list[RecordEvent]) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for stage, entered, left in stage_segments(deal, events):
        totals[stage] += (left - entered).total_seconds()
    return dict(totals)
