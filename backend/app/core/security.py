import hashlib
import secrets
from datetime import timedelta
from typing import NamedTuple

import bcrypt
import jwt

from app.core.config import get_settings
from app.core.db import utcnow


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str, workspace_id: str | None, session_version: int = 0) -> str:
    """`wid` pins the active workspace and `sv` the session version; both are re-checked on every request."""
    settings = get_settings()
    now = utcnow()
    payload = {"sub": user_id, "wid": workspace_id, "sv": session_version, "iat": now, "exp": now + timedelta(minutes=settings.jwt_ttl_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


class Claims(NamedTuple):
    user_id: str
    workspace_id: str | None
    # 0 for tokens issued before session versions existed (they stay valid until the first revocation).
    session_version: int


STREAM = "stream"
STREAM_TTL = timedelta(seconds=60)


def create_stream_ticket(user_id: str, workspace_id: str | None, session_version: int) -> str:
    """A one-minute token that only opens the live event stream: EventSource has to put it in the URL, where it may be
    logged, so it must not be the session token."""
    settings = get_settings()
    now = utcnow()
    payload = {"sub": user_id, "wid": workspace_id, "sv": session_version, "typ": STREAM, "iat": now, "exp": now + STREAM_TTL}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode(token: str) -> dict[str, object] | None:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


def _claims(claims: dict[str, object]) -> Claims:
    return Claims(str(claims["sub"]), claims.get("wid"), int(claims.get("sv", 0)))  # type: ignore[arg-type, call-overload]


def decode_access_token(token: str) -> Claims | None:
    """Returns the claims, or None when the token is invalid, expired — or a stream ticket."""
    claims = _decode(token)
    return _claims(claims) if claims and claims.get("typ") != STREAM else None


def decode_stream_ticket(ticket: str) -> Claims | None:
    claims = _decode(ticket)
    return _claims(claims) if claims and claims.get("typ") == STREAM else None



def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def new_token() -> tuple[str, str]:
    """A URL-safe single-use secret and the hash stored in the database."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)
