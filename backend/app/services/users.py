from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import Conflict
from app.core.security import hash_password
from app.models import User


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def create_user(db: Session, full_name: str, email: str, password: str | None, verified: bool = False) -> User:
    if find_user_by_email(db, email):
        raise Conflict("An account with this email already exists", "email_taken")
    user = User(
        email=email.lower(), full_name=full_name, password_hash=hash_password(password) if password else None,
        email_verified_at=utcnow() if verified else None,
    )
    db.add(user)
    db.flush()
    return user


def revoke_sessions(user: User) -> None:
    """Signs the user out everywhere: tokens carrying an older session version stop working."""
    user.session_version += 1
