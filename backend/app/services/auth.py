"""Sessions: sign-up, sign-in, demo access and switching between workspaces."""

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import Forbidden, Unauthorized
from app.core.security import create_access_token, verify_password
from app.models import Membership, User, Workspace
from app.schemas.auth import LoginIn, RegisterIn, SessionOut, TokenOut, UserOut, WorkspaceChoice
from app.services import billing, login_guard, permissions, workspaces
from app.services.account import send_verification
from app.services.onboarding import create_workspace
from app.services.seed import seed_workspace
from app.services.users import create_user, find_user_by_email


def primary_workspace(db: Session, user_id: str) -> Workspace:
    return workspaces.resolve(db, user_id)[1]


def session_out(db: Session, user: User, workspace_id: str | None = None) -> SessionOut:
    """A superadmin may have no company; everyone else must belong to at least one."""
    found = workspaces.resolve_optional(db, user.id, workspace_id)
    if found is None and not user.is_superadmin:
        raise Forbidden("User has no workspace", "no_workspace")
    if found is None:
        return SessionOut(user=UserOut.model_validate(user), workspace=None, role=None)
    membership, workspace = found
    return SessionOut(
        user=UserOut.model_validate(user), workspace=billing.workspace_out(db, workspace),
        role=membership.role,  # type: ignore[arg-type]
        permissions=permissions.resolve(db, membership).as_dict(),
    )


def issue_token(db: Session, user: User, workspace_id: str | None = None) -> TokenOut:
    session = session_out(db, user, workspace_id)
    token = create_access_token(user.id, session.workspace.id if session.workspace else None, user.session_version)
    return TokenOut(**session.model_dump(), access_token=token)


def register(db: Session, data: RegisterIn) -> TokenOut:
    if not get_settings().registration_enabled:
        raise Forbidden("Accounts are created by an administrator", "registration_disabled")
    user = create_user(db, data.full_name, data.email, data.password)
    create_workspace(db, user, f"{data.full_name.split()[0]}'s workspace")
    send_verification(db, user)
    return issue_token(db, user)


def login(db: Session, data: LoginIn, ip: str | None = None) -> TokenOut:
    email = data.email.lower()
    login_guard.ensure_allowed(db, email)
    user = find_user_by_email(db, email)
    valid = bool(user and user.password_hash and verify_password(data.password, user.password_hash))
    login_guard.record(db, email, ip, success=valid)
    if not valid or user is None:
        raise Unauthorized("Invalid email or password", "invalid_credentials")
    if not user.is_active:
        raise Forbidden("This account has been deactivated", "account_disabled")
    return issue_token(db, user)


def ensure_demo_user(db: Session) -> User:
    """Creates the passwordless demo account (and its seeded workspace) on first use."""
    email = get_settings().demo_email
    user = find_user_by_email(db, email)
    if user:
        return user
    user = create_user(db, "Alex Morgan", email, None, verified=True)
    workspace = create_workspace(db, user, "Orbit Demo", is_demo=True)
    seed_workspace(db, workspace.id, user.id)
    return user


def demo_login(db: Session) -> TokenOut:
    if not get_settings().demo_enabled:
        raise Forbidden("Demo is disabled", "demo_disabled")
    return issue_token(db, ensure_demo_user(db))


def list_workspaces(db: Session, user_id: str) -> list[WorkspaceChoice]:
    return [WorkspaceChoice(id=w.id, name=w.name, is_demo=w.is_demo, role=m.role, status=billing.effective_status(w)) for m, w in workspaces.memberships(db, user_id)]  # type: ignore[arg-type]


def switch_workspace(db: Session, user: User, workspace_id: str) -> TokenOut:
    if not any(w.id == workspace_id for _, w in workspaces.memberships(db, user.id)):
        raise Forbidden("You are not a member of this workspace", "forbidden")
    return issue_token(db, user, workspace_id)


def is_member(db: Session, user_id: str, workspace_id: str) -> bool:
    return db.get(Membership, (workspace_id, user_id)) is not None
