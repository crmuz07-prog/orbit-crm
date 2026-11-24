"""Workspace access configuration: access roles (permission sets) and sales teams."""

from collections import Counter
from typing import Any, TypeVar

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import Conflict, NotFound
from app.models import AccessRole, Membership, SalesTeam
from app.schemas.access import AccessOut, AccessRoleOut, SalesTeamOut
from app.services.permissions import normalise

Row = TypeVar("Row", AccessRole, SalesTeam)


def get_owned(db: Session, model: type[Row], workspace_id: str, row_id: str) -> Row:
    row = db.get(model, row_id)
    if row is None or row.workspace_id != workspace_id:
        raise NotFound(f"{model.__name__} not found", "not_found")
    return row


def _commit_unique(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise Conflict("This name is already used", "name_taken") from error


def overview(db: Session, workspace_id: str) -> AccessOut:
    members = list(db.scalars(select(Membership).where(Membership.workspace_id == workspace_id, Membership.role == "member")))
    roles = list(db.scalars(select(AccessRole).where(AccessRole.workspace_id == workspace_id).order_by(AccessRole.created_at)))
    teams = list(db.scalars(select(SalesTeam).where(SalesTeam.workspace_id == workspace_id).order_by(SalesTeam.name)))
    default = next((r.id for r in roles if r.is_default), None)
    # Members without an explicit role are on the default one.
    by_role = Counter(m.access_role_id or default for m in members)
    by_team = Counter(m.team_id for m in members)
    return AccessOut(
        roles=[AccessRoleOut(id=r.id, name=r.name, permissions=normalise(r.permissions), is_default=r.is_default, member_count=by_role[r.id]) for r in roles],
        teams=[SalesTeamOut(id=t.id, name=t.name, member_count=by_team[t.id]) for t in teams],
    )


def create_role(db: Session, workspace_id: str, name: str, permissions: dict[str, Any]) -> None:
    db.add(AccessRole(workspace_id=workspace_id, name=name, permissions=normalise(permissions)))
    _commit_unique(db)


def update_role(db: Session, workspace_id: str, role_id: str, name: str | None, permissions: dict[str, Any] | None, is_default: bool | None) -> None:
    role = get_owned(db, AccessRole, workspace_id, role_id)
    if name is not None:
        role.name = name
    if permissions is not None:
        role.permissions = normalise(permissions)
    if is_default:
        db.execute(update(AccessRole).where(AccessRole.workspace_id == workspace_id).values(is_default=False))
        role.is_default = True
    _commit_unique(db)


def delete_role(db: Session, workspace_id: str, role_id: str) -> None:
    role = get_owned(db, AccessRole, workspace_id, role_id)
    if role.is_default:
        raise Conflict("The default role cannot be deleted", "default_role")
    # Holders fall back to the default role (the foreign key is SET NULL; resolution picks the default).
    db.execute(update(Membership).where(Membership.access_role_id == role.id).values(access_role_id=None))
    db.delete(role)
    db.commit()


def create_team(db: Session, workspace_id: str, name: str) -> None:
    db.add(SalesTeam(workspace_id=workspace_id, name=name))
    _commit_unique(db)


def rename_team(db: Session, workspace_id: str, team_id: str, name: str) -> None:
    get_owned(db, SalesTeam, workspace_id, team_id).name = name
    _commit_unique(db)


def delete_team(db: Session, workspace_id: str, team_id: str) -> None:
    team = get_owned(db, SalesTeam, workspace_id, team_id)
    db.execute(update(Membership).where(Membership.team_id == team.id).values(team_id=None))
    db.delete(team)
    db.commit()
