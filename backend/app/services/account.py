"""Password reset, email verification and profile changes."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import utcnow
from app.core.errors import DomainError, Forbidden
from app.core.security import hash_password, verify_password
from app.models import User
from app.services import tokens
from app.services.mailer import link, send_mail
from app.services.users import find_user_by_email


def _is_demo(user: User) -> bool:
    return user.email == get_settings().demo_email


def reset_link(db: Session, user: User) -> str:
    raw = tokens.issue(db, user, "reset", timedelta(minutes=get_settings().reset_ttl_minutes))
    return link("/reset", raw)


def request_password_reset(db: Session, email: str) -> None:
    """Silent for unknown emails, so the endpoint cannot be used to discover accounts."""
    user = find_user_by_email(db, email)
    if user is None or _is_demo(user):
        return
    send_mail(user.email, "Reset your Orbit CRM password", f"Open this link to set a new password (valid for 1 hour):\n{reset_link(db, user)}")


def reset_password(db: Session, raw_token: str, password: str) -> User:
    user = tokens.consume(db, raw_token, "reset")
    user.password_hash = hash_password(password)
    user.must_change_password = False
    # Possession of the emailed link proves ownership of the address.
    user.email_verified_at = user.email_verified_at or utcnow()
    db.commit()
    return user


def send_verification(db: Session, user: User) -> None:
    if user.email_verified:
        return
    raw = tokens.issue(db, user, "verify", timedelta(hours=get_settings().verify_ttl_hours))
    send_mail(user.email, "Confirm your email for Orbit CRM", f"Confirm your email address:\n{link('/verify', raw)}")


def verify_email(db: Session, raw_token: str) -> User:
    user = tokens.consume(db, raw_token, "verify")
    user.email_verified_at = user.email_verified_at or utcnow()
    db.commit()
    return user


def update_profile(db: Session, user: User, full_name: str) -> User:
    if _is_demo(user):
        raise Forbidden("The demo account cannot be changed", "demo_read_only")
    user.full_name = full_name
    db.commit()
    return user


def change_password(db: Session, user: User, current: str | None, new: str) -> None:
    if _is_demo(user):
        raise Forbidden("The demo account cannot be changed", "demo_read_only")
    # Accounts created through an invite link without a password may set one without a current password.
    if user.password_hash and (not current or not verify_password(current, user.password_hash)):
        raise DomainError("The current password is incorrect", "wrong_password")
    user.password_hash = hash_password(new)
    user.must_change_password = False
    db.commit()
