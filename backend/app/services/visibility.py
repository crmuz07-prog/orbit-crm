"""Turns a permission scope into query filters and owner-assignment checks.

own  → records I own; team → records owned by anyone in my sales team, plus unowned ones;
all  → the whole workspace. A member without a team at team scope sees their own and unowned records.
"""

from dataclasses import dataclass
from typing import Any

from sqlalchemy import ColumnElement, or_, select, true
from sqlalchemy.orm import Session

from app.core.errors import Forbidden, NotFound
from app.models import Membership
from app.models.base import OwnedMixin
from app.services.permissions import Access, Module


@dataclass(frozen=True)
class Visibility:
    # None = no owner restriction.
    owners: frozenset[str] | None
    include_unowned: bool

    def where(self, model: type[OwnedMixin]) -> ColumnElement[bool]:
        if self.owners is None:
            return true()
        owned = model.owner_id.in_(self.owners)
        return or_(owned, model.owner_id.is_(None)) if self.include_unowned else owned

    def allows(self, row: OwnedMixin) -> bool:
        if self.owners is None:
            return True
        return row.owner_id in self.owners or (self.include_unowned and row.owner_id is None)

    def can_assign(self, owner_id: str | None) -> bool:
        # Leaving a record unowned is only possible where unowned records stay visible.
        return self.include_unowned if owner_id is None else self.owners is None or owner_id in self.owners


def team_user_ids(db: Session, membership: Membership) -> frozenset[str]:
    if membership.team_id is None:
        return frozenset({membership.user_id})
    query = select(Membership.user_id).where(Membership.workspace_id == membership.workspace_id, Membership.team_id == membership.team_id)
    return frozenset(db.scalars(query))


def for_module(db: Session, access: Access, membership: Membership, module: Module) -> Visibility:
    scope = access.scope(module)
    if scope == "all":
        return Visibility(owners=None, include_unowned=True)
    if scope == "team":
        return Visibility(owners=team_user_ids(db, membership), include_unowned=True)
    return Visibility(owners=frozenset({membership.user_id}), include_unowned=False)


def workspace_user_ids(db: Session, workspace_id: str) -> frozenset[str]:
    return frozenset(db.scalars(select(Membership.user_id).where(Membership.workspace_id == workspace_id)))


def ensure_visible(row: Any, visibility: Visibility) -> None:
    """Records outside the scope look like they don't exist (no information leak)."""
    if not visibility.allows(row):
        raise NotFound(f"{type(row).__name__} not found", "not_found")


def ensure_assignable(db: Session, workspace_id: str, owner_id: str | None, visibility: Visibility) -> None:
    if owner_id is not None and owner_id not in workspace_user_ids(db, workspace_id):
        raise Forbidden("The owner must be a member of this workspace", "owner_out_of_scope")
    if not visibility.can_assign(owner_id):
        raise Forbidden("You can't assign records to this person", "owner_out_of_scope")
