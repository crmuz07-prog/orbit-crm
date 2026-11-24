"""Platform administration (superadmin): companies, users, passwords and memberships."""

from collections import defaultdict
from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import Forbidden, NotFound
from app.models import Membership, User, Workspace
from app.schemas.admin import AdminUserIn, AdminUserOut, CompanyIn, CompanyOut, MembershipOut
from app.services import team
from app.services.onboarding import default_stages
from app.services.users import create_user, find_user_by_email

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
    return [
        CompanyOut(id=w.id, name=w.name, is_demo=w.is_demo, created_at=w.created_at, member_count=len(members[w.id]),
                   owners=[u.email for m, u in members[w.id] if m.role == "owner"])
        for w in companies
    ]


def create_company(db: Session, data: CompanyIn) -> CompanyOut:
    """A new company with its default pipeline and an owner login (existing accounts are reused)."""
    workspace = Workspace(name=data.name)
    db.add(workspace)
    db.flush()
    db.add_all(default_stages(workspace.id))
    team.join(db, workspace, data.owner.full_name, data.owner.email, "owner", data.owner.password)
    return next(c for c in list_companies(db) if c.id == workspace.id)


def rename_company(db: Session, workspace_id: str, name: str) -> None:
    _get(db, Workspace, workspace_id).name = name
    db.commit()


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
    for field, value in {"full_name": full_name, "is_active": is_active, "is_superadmin": is_superadmin}.items():
        if value is not None:
            setattr(user, field, value)
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
