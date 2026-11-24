"""Subscriptions and seats, as in erp1 (src/lib/subscription.ts, tenant-status.ts, payments route).

Plain calendar arithmetic on dates: the end date is inclusive, month ends clamp (31 Jan + 1 month = 28/29 Feb),
and status is enforced lazily on read — no scheduler needed.
"""

import calendar
from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import Conflict, Forbidden
from app.models import Membership, User, Workspace, WorkspacePayment
from app.schemas.auth import WorkspaceOut

WARNING_DAYS = 7


def today() -> date:
    return datetime.now(ZoneInfo(get_settings().billing_timezone)).date()


def add_months(start: date, months: int) -> date:
    total = start.year * 12 + start.month - 1 + months
    year, month = divmod(total, 12)
    day = min(start.day, calendar.monthrange(year, month + 1)[1])
    return date(year, month + 1, day)


def days_left(ends_at: date | None, on: date | None = None) -> int | None:
    return None if ends_at is None else (ends_at - (on or today())).days


def is_expired(ends_at: date | None, on: date | None = None) -> bool:
    # Inclusive: a subscription ending on the 22nd still works all day on the 22nd.
    left = days_left(ends_at, on)
    return left is not None and left < 0


def effective_status(workspace: Workspace) -> str:
    if workspace.is_demo:
        return "active"
    if workspace.status == "blocked":
        return "blocked"
    return "expired" if is_expired(workspace.subscription_ends_at) else "active"


def ensure_open(workspace: Workspace) -> None:
    """Called for every CRM request; superadmins are exempt (see api/deps.py)."""
    status = effective_status(workspace)
    if status == "blocked":
        raise Forbidden("This company has been blocked by the platform administrator", "company_blocked")
    if status == "expired":
        raise Forbidden("The subscription of this company has ended", "subscription_expired")


def seats_used(db: Session, workspace_id: str) -> int:
    query = (
        select(func.count()).select_from(Membership).join(User, User.id == Membership.user_id)
        .where(Membership.workspace_id == workspace_id, User.is_active.is_(True))
    )
    return db.scalar(query) or 0


def ensure_seat(db: Session, workspace: Workspace) -> None:
    """One more active user must fit into the paid seats."""
    if workspace.seat_limit is not None and seats_used(db, workspace.id) >= workspace.seat_limit:
        raise Conflict("All paid seats of this company are in use", "seat_limit_reached")


def record_payment(db: Session, workspace: Workspace, actor_id: str, amount: float, months: int | None, seats: int | None, note: str | None) -> WorkspacePayment:
    """Extends from the later of today and the current end date, so paying early stacks the new term."""
    current = workspace.subscription_ends_at
    start = current if current and not is_expired(current) else today()
    term = months or workspace.license_months or 1
    payment = WorkspacePayment(
        workspace_id=workspace.id, amount=amount, months=term, seats=seats, note=note, recorded_by=actor_id,
        period_start=start, period_end=add_months(start, term),
    )
    workspace.subscription_ends_at, workspace.license_months, workspace.status = payment.period_end, term, "active"
    workspace.price_paid = (workspace.price_paid or 0) + amount
    if seats is not None:
        workspace.seat_limit = seats
    db.add(payment)
    db.commit()
    return payment


def payments(db: Session, workspace_id: str | None = None) -> list[WorkspacePayment]:
    query = select(WorkspacePayment).order_by(WorkspacePayment.created_at.desc())
    if workspace_id:
        query = query.where(WorkspacePayment.workspace_id == workspace_id)
    return list(db.scalars(query))


def workspace_out(db: Session, workspace: Workspace) -> WorkspaceOut:
    return WorkspaceOut(
        id=workspace.id, name=workspace.name, is_demo=workspace.is_demo, status=effective_status(workspace),  # type: ignore[arg-type]
        subscription_ends_at=workspace.subscription_ends_at, days_left=days_left(workspace.subscription_ends_at),
        seat_limit=workspace.seat_limit, seats_used=seats_used(db, workspace.id),
    )
