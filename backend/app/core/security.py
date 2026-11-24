import hashlib
import secrets
from datetime import timedelta

import bcrypt
import jwt

from app.core.config import get_settings
from app.core.db import utcnow


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str, workspace_id: str | None) -> str:
    """`wid` pins the active workspace; it is re-checked against memberships on every request."""
    settings = get_settings()
    payload = {"sub": user_id, "wid": workspace_id, "exp": utcnow() + timedelta(minutes=settings.jwt_ttl_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> tuple[str, str | None] | None:
    """Returns (user id, workspace id), or None when the token is invalid or expired."""
    settings = get_settings()
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
    return claims["sub"], claims.get("wid")


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def new_token() -> tuple[str, str]:
    """A URL-safe single-use secret and the hash stored in the database."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)
