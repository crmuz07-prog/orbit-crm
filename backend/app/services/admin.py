"""Platform administration (superadmin): companies, users, passwords and memberships."""

from collections import defaultdict
from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import Forbidden, NotFound
from app.models import Membership, User, Workspace, WorkspacePayment
from app.schemas.admin import AdminUserIn, AdminUserOut, CompanyIn, CompanyOut, MembershipOut, PaymentIn, PaymentOut
from app.services import billing, team
from app.services.onboarding import workspace_defaults
from app.services.users import create_user, find_user_by_email, revoke_sessions

Row = TypeVar("Row", User, Workspace)


def _get(db: Session, model: type[Row], row_id: str) -> Row:
    row = db.get(model, row_id)
    if row is None:
        raise NotFound(f"{model.__name__} not found", "not_found")
    return row


def _all_memberships(db: Session) -> list[tuple[Membership, User, Workspace]]:
    query = select(Membership, User, Workspace).join(User, User.id == Membership.user_id).join(Workspace, Workspace.id == Membership.workspace_id)
    return [(m, u, w) for m, u, w in db.execute(query).all()]


def list_companies(db: Session) -> list[CompanyOut]:
    members: dict[str, list[tuple[Membership, User]]] = defaultdict(list)
    for m, u, _ in _all_memberships(db):
        members[m.workspace_id].append((m, u))
    companies = db.scalars(select(Workspace).order_by(Workspace.created_at.desc()))
    return [company_out(w, members[w.id]) for w in companies]


def company_out(w: Workspace, members: list[tuple[Membership, User]]) -> CompanyOut:
    return CompanyOut(
        id=w.id, name=w.name, is_demo=w.is_demo, created_at=w.created_at, member_count=len(members),
        owners=[u.email for m, u in members if m.role == "owner"], status=billing.effective_status(w),  # type: ignore[arg-type]
        subscription_ends_at=w.subscription_ends_at, days_left=billing.days_left(w.subscription_ends_at),
        seat_limit=w.seat_limit, seats_used=sum(1 for _, u in members if u.is_active),
        license_months=w.license_months, price_paid=w.price_paid,
    )


def create_company(db: Session, data: CompanyIn) -> CompanyOut:
    """A new company with its default pipeline and an owner login (existing accounts are reused)."""
    workspace = Workspace(name=data.name, seat_limit=data.seat_limit, subscription_ends_at=data.subscription_ends_at)
    db.add(workspace)
    db.flush()
    db.add_all(workspace_defaults(workspace.id))
    team.join(db, workspace, data.owner.full_name, data.owner.email, "owner", data.owner.password)
    return next(c for c in list_companies(db) if c.id == workspace.id)


def update_company(db: Session, workspace_id: str, changes: dict[str, object]) -> None:
    """Name, manual block/unblock, seat limit, end date and default term (only the fields present are changed)."""
    workspace = _get(db, Workspace, workspace_id)
    for field, value in changes.items():
        setattr(workspace, field, value)
    db.commit()


def company(db: Session, workspace_id: str) -> CompanyOut:
    return next(c for c in list_companies(db) if c.id == workspace_id)


def record_payment(db: Session, actor: User, workspace_id: str, data: PaymentIn) -> PaymentOut:
    workspace = _get(db, Workspace, workspace_id)
    payment = billing.record_payment(db, workspace, actor.id, data.amount, data.months, data.seats, data.note)
    return payment_out(payment, workspace.name)


def payment_out(payment: WorkspacePayment, workspace_name: str) -> PaymentOut:
    return PaymentOut(**{c: getattr(payment, c) for c in PaymentOut.model_fields if c != "workspace_name"}, workspace_name=workspace_name)


def list_payments(db: Session, workspace_id: str | None = None) -> list[PaymentOut]:
    names = dict(db.execute(select(Workspace.id, Workspace.name)).tuples().all())
    return [payment_out(p, names.get(p.workspace_id, "")) for p in billing.payments(db, workspace_id)]


def list_users(db: Session) -> list[AdminUserOut]:
    memberships: dict[str, list[MembershipOut]] = defaultdict(list)
    for m, u, w in _all_memberships(db):
        memberships[u.id].append(MembershipOut(workspace_id=w.id, workspace_name=w.name, role=m.role))  # type: ignore[arg-type]
    users = db.scalars(select(User).order_by(User.created_at.desc()))
    return [AdminUserOut(id=u.id, full_name=u.full_name, email=u.email, is_active=u.is_active, is_superadmin=u.is_superadmin,
                         must_change_password=u.must_change_password, created_at=u.created_at, memberships=memberships[u.id]) for u in users]


def user_out(db: Session, user_id: str) -> AdminUserOut:
    return next(u for u in list_users(db) if u.id == user_id)


def create_account(db: Session, data: AdminUserIn) -> AdminUserOut:
    if data.workspace_id:
        _, user, _ = team.join(db, _get(db, Workspace, data.workspace_id), data.full_name, data.email, data.role, data.password)
        return user_out(db, user.id)
    user = create_user(db, data.full_name, data.email, None, verified=True)
    team.set_temporary_password(user, data.password)
    db.commit()
    return user_out(db, user.id)


def update_account(db: Session, actor: User, user_id: str, full_name: str | None, is_active: bool | None, is_superadmin: bool | None) -> AdminUserOut:
    user = _get(db, User, user_id)
    # The operator must not lock themselves out of the platform.
    if user.id == actor.id and (is_active is False or is_superadmin is False):
        raise Forbidden("You cannot deactivate or demote yourself", "self_lockout")
    if is_active and not user.is_active:
        # Reactivation takes a seat again in every company the person belongs to.
        for workspace in db.scalars(select(Workspace).join(Membership).where(Membership.user_id == user.id)):
            billing.ensure_seat(db, workspace)
    for field, value in {"full_name": full_name, "is_active": is_active, "is_superadmin": is_superadmin}.items():
        if value is not None:
            setattr(user, field, value)
    if is_active is False:
        revoke_sessions(user)
    db.commit()
    return user_out(db, user.id)


def set_password(db: Session, user_id: str, password: str) -> None:
    team.set_temporary_password(_get(db, User, user_id), password)
    db.commit()


def add_membership(db: Session, user_id: str, workspace_id: str, role: str) -> AdminUserOut:
    user = _get(db, User, user_id)
    team.join(db, _get(db, Workspace, workspace_id), user.full_name, user.email, role, None)
    return user_out(db, user_id)


def remove_membership(db: Session, user_id: str, workspace_id: str) -> AdminUserOut:
    membership = team.target(db, workspace_id, user_id)
    team.guard_last_owner(db, membership)
    db.delete(membership)
    db.commit()
    return user_out(db, user_id)


def ensure_superadmin(db: Session, email: str, password: str) -> None:
    """Start-up bootstrap from env: creates the operator once; an existing account is promoted, never overwritten."""
    user = find_user_by_email(db, email)
    if user is None:
        user = create_user(db, "Superadmin", email, password, verified=True)
    user.is_superadmin, user.is_active = True, True
    db.commit()
