"""Single-use, expiring account tokens (password reset, email verification)."""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import DomainError
from app.core.security import hash_token, new_token
from app.models import AuthToken, User


def issue(db: Session, user: User, purpose: str, ttl: timedelta) -> str:
    raw, digest = new_token()
    db.add(AuthToken(user_id=user.id, purpose=purpose, token_hash=digest, expires_at=utcnow() + ttl))
    db.commit()
    return raw


def consume(db: Session, raw: str, purpose: str) -> User:
    """Marks the token used and returns its user; unknown, used and expired tokens all fail the same way."""
    token = db.scalar(select(AuthToken).where(AuthToken.token_hash == hash_token(raw), AuthToken.purpose == purpose))
    if token is None or token.used_at is not None or token.expires_at < utcnow():
        raise DomainError("This link is invalid or has expired", "invalid_token")
    token.used_at = utcnow()
    user = db.get(User, token.user_id)
    if user is None:
        raise DomainError("This link is invalid or has expired", "invalid_token")
    return user
