"""Brute-force protection for password sign-in (as in erp1: per-account limit plus an attempt log)."""

from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import TooManyRequests
from app.models import LoginAttempt

MAX_FAILURES = 5
WINDOW = timedelta(minutes=15)


def recent_failures(db: Session, email: str) -> int:
    since = utcnow() - WINDOW
    query = select(func.count()).select_from(LoginAttempt).where(
        LoginAttempt.email == email, LoginAttempt.success.is_(False), LoginAttempt.created_at >= since,
    )
    return db.scalar(query) or 0


def ensure_allowed(db: Session, email: str) -> None:
    # Keyed by account, not IP: an attacker rotating addresses still hits the same limit.
    if recent_failures(db, email) >= MAX_FAILURES:
        raise TooManyRequests("Too many failed sign-in attempts. Try again in 15 minutes.", "too_many_attempts")


def record(db: Session, email: str, ip: str | None, success: bool) -> None:
    db.add(LoginAttempt(email=email, ip=ip, success=success))
    db.commit()


def recent_attempts(db: Session, limit: int = 200) -> list[LoginAttempt]:
    return list(db.scalars(select(LoginAttempt).order_by(LoginAttempt.created_at.desc()).limit(limit)))
