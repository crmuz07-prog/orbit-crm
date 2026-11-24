"""Team management inside one company: members, roles and admin-issued logins (ERP-style provisioning)."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import Conflict, Forbidden, NotFound
from app.core.security import hash_password
from app.models import Membership, User, Workspace
from app.services.users import create_user, find_user_by_email
from app.services.workspaces import ROLE_RANK


def members(db: Session, workspace_id: str) -> list[tuple[Membership, User]]:
    query = select(Membership, User).join(User, User.id == Membership.user_id).where(Membership.workspace_id == workspace_id).order_by(Membership.created_at)
    return [(m, u) for m, u in db.execute(query).all()]


def guard_role_change(actor_role: str, target_role: str) -> None:
    """Admins manage members and admins; only owners can grant or take away ownership."""
    if ROLE_RANK[target_role] >= ROLE_RANK["owner"] and actor_role != "owner":
        raise Forbidden("Only an owner can manage owners", "forbidden")


def set_temporary_password(user: User, password: str) -> None:
    user.password_hash = hash_password(password)
    user.must_change_password = True


def join(db: Session, workspace: Workspace, full_name: str, email: str, role: str, password: str | None) -> tuple[Membership, User, bool]:
    """Adds a person to a company: an existing account just gains the membership, a new one gets a temporary password.

    Returns (membership, user, created) — `created` tells the UI whether the issued password applies.
    """
    user = find_user_by_email(db, email)
    created = user is None
    if user is None:
        if password is None:
            raise NotFound("User not found", "not_found")
        user = create_user(db, full_name, email, None, verified=True)  # the admin vouches for the address
        set_temporary_password(user, password)
    elif db.get(Membership, (workspace.id, user.id)) is not None:
        raise Conflict("This person is already in the workspace", "already_member")
    membership = Membership(workspace_id=workspace.id, user_id=user.id, role=role)
    db.add(membership)
    db.commit()
    return membership, user, created


def add_member(db: Session, actor: Membership, workspace: Workspace, full_name: str, email: str, role: str, password: str) -> tuple[Membership, User, bool]:
    guard_role_change(actor.role, role)
    return join(db, workspace, full_name, email, role, password)


def _owner_count(db: Session, workspace_id: str) -> int:
    query = select(func.count()).select_from(Membership).where(Membership.workspace_id == workspace_id, Membership.role == "owner")
    return db.scalar(query) or 0


def target(db: Session, workspace_id: str, user_id: str) -> Membership:
    membership = db.get(Membership, (workspace_id, user_id))
    if membership is None:
        raise NotFound("Member not found", "not_found")
    return membership


def guard_last_owner(db: Session, membership: Membership) -> None:
    if membership.role == "owner" and _owner_count(db, membership.workspace_id) <= 1:
        raise Conflict("A workspace needs at least one owner", "last_owner")


def change_role(db: Session, actor: Membership, user_id: str, role: str) -> Membership:
    membership = target(db, actor.workspace_id, user_id)
    guard_role_change(actor.role, membership.role)
    guard_role_change(actor.role, role)
    if role != "owner":
        guard_last_owner(db, membership)
    membership.role = role
    db.commit()
    return membership


def remove(db: Session, actor: Membership, user_id: str) -> None:
    membership = target(db, actor.workspace_id, user_id)
    guard_role_change(actor.role, membership.role)
    guard_last_owner(db, membership)
    db.delete(membership)
    db.commit()


def set_member_password(db: Session, actor: Membership, user_id: str, password: str) -> User:
    if user_id == actor.user_id:
        raise Forbidden("Use the account settings to change your own password", "forbidden")
    guard_role_change(actor.role, target(db, actor.workspace_id, user_id).role)
    user = db.get(User, user_id)
    assert user is not None  # guaranteed by the membership foreign key
    set_temporary_password(user, password)
    db.commit()
    return user
