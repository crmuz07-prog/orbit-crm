from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import Conflict, Forbidden, Unauthorized
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Membership, User, Workspace
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut, WorkspaceOut
from app.services.onboarding import create_workspace
from app.services.seed import seed_workspace


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def primary_workspace(db: Session, user_id: str) -> Workspace:
    query = (
        select(Workspace)
        .join(Membership, Membership.workspace_id == Workspace.id)
        .where(Membership.user_id == user_id)
        .order_by(Membership.created_at)
    )
    workspace = db.scalars(query).first()
    if workspace is None:
        raise Forbidden("User has no workspace", "no_workspace")
    return workspace


def issue_token(db: Session, user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
        workspace=WorkspaceOut.model_validate(primary_workspace(db, user.id)),
    )


def register(db: Session, data: RegisterIn) -> TokenOut:
    if find_user_by_email(db, data.email):
        raise Conflict("An account with this email already exists", "email_taken")
    user = User(email=data.email.lower(), full_name=data.full_name, password_hash=hash_password(data.password))
    db.add(user)
    db.flush()
    create_workspace(db, user, f"{data.full_name.split()[0]}'s workspace")
    return issue_token(db, user)


def login(db: Session, data: LoginIn) -> TokenOut:
    user = find_user_by_email(db, data.email)
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise Unauthorized("Invalid email or password", "invalid_credentials")
    return issue_token(db, user)


def ensure_demo_user(db: Session) -> User:
    """Creates the passwordless demo account (and its seeded workspace) on first use."""
    email = get_settings().demo_email
    user = find_user_by_email(db, email)
    if user:
        return user
    user = User(email=email, full_name="Alex Morgan", password_hash=None)
    db.add(user)
    db.flush()
    workspace = create_workspace(db, user, "Orbit Demo", is_demo=True)
    seed_workspace(db, workspace.id)
    return user


def demo_login(db: Session) -> TokenOut:
    if not get_settings().demo_enabled:
        raise Forbidden("Demo is disabled", "demo_disabled")
    return issue_token(db, ensure_demo_user(db))
