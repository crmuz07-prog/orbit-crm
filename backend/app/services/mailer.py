"""Outgoing email. Uses SMTP when configured; otherwise logs the message (local dev / no provider yet)."""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

log = logging.getLogger("orbit.mail")


def send_mail(to: str, subject: str, body: str) -> bool:
    """Returns True when the message was handed to SMTP. Failures never break the calling request."""
    settings = get_settings()
    if not settings.smtp_host:
        log.info("Email to %s (SMTP not configured): %s\n%s", to, subject, body)
        return False
    message = EmailMessage()
    message["From"], message["To"], message["Subject"] = settings.smtp_from, to, subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
        return True
    except (smtplib.SMTPException, OSError) as exc:
        log.warning("Could not send email to %s: %s", to, exc)
        return False


def link(path: str, token: str) -> str:
    return f"{get_settings().frontend_url.rstrip('/')}{path}?token={token}"
