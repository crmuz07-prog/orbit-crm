import secrets

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import IdMixin, TimestampMixin


def new_token() -> str:
    return secrets.token_urlsafe(24)


class TelephonyIntegration(IdMixin, TimestampMixin, Base):
    """Per-workspace PBX/VoIP connection: the URL token identifies the workspace, the secret signs payloads."""

    __tablename__ = "telephony_integrations"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), unique=True)
    webhook_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=new_token)
    signing_secret: Mapped[str] = mapped_column(String(64), default=new_token)
    create_unknown_contacts: Mapped[bool] = mapped_column(default=True)
    callback_task_on_missed: Mapped[bool] = mapped_column(default=True)
