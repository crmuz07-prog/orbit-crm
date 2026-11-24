"""Memberships, roles and the active-workspace rule shared by auth, team management and every request."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import Forbidden
from app.models import Membership, Workspace

ROLE_RANK = {"member": 0, "admin": 1, "owner": 2}


def memberships(db: Session, user_id: str) -> list[tuple[Membership, Workspace]]:
    query = (
        select(Membership, Workspace)
        .join(Workspace, Workspace.id == Membership.workspace_id)
        .where(Membership.user_id == user_id)
        .order_by(Membership.created_at)
    )
    return [(m, w) for m, w in db.execute(query).all()]


def resolve_optional(db: Session, user_id: str, workspace_id: str | None = None) -> tuple[Membership, Workspace] | None:
    """The requested workspace if the user belongs to it, otherwise the first one they joined (None: no company)."""
    rows = memberships(db, user_id)
    return next(((m, w) for m, w in rows if w.id == workspace_id), rows[0]) if rows else None


def resolve(db: Session, user_id: str, workspace_id: str | None = None) -> tuple[Membership, Workspace]:
    found = resolve_optional(db, user_id, workspace_id)
    if found is None:
        raise Forbidden("User has no workspace", "no_workspace")
    return found


def require_role(membership: Membership, minimum: str) -> None:
    if ROLE_RANK[membership.role] < ROLE_RANK[minimum]:
        raise Forbidden("You do not have permission to do this", "forbidden")


def require_editable(workspace: Workspace) -> None:
    """The shared demo workspace must not be hijacked by inviting people or changing roles."""
    if workspace.is_demo:
        raise Forbidden("The demo workspace cannot be changed", "demo_read_only")
