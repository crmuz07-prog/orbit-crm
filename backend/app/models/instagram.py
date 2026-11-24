import secrets
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, UTCDateTime, utcnow
from app.models.base import IdMixin, TimestampMixin


def new_token() -> str:
    return secrets.token_urlsafe(24)


class InstagramIntegration(IdMixin, TimestampMixin, Base):
    """A workspace's connection to its Instagram Business account through a Meta app (Graph API + webhooks)."""

    __tablename__ = "instagram_integrations"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), unique=True)
    # In the callback URL Meta calls; identifies the workspace.
    webhook_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=new_token)
    # Typed into Meta's webhook form; Meta echoes it back once to prove the URL is ours.
    verify_token: Mapped[str] = mapped_column(String(64), default=new_token)
    # Write-only secrets: the app secret signs webhooks, the page access token reads profiles/leads and sends replies.
    app_secret: Mapped[str | None] = mapped_column(String(200), nullable=True)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    ig_account_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Where new leads land and who owns them.
    stage_id: Mapped[str | None] = mapped_column(ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_event_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class InboundLead(IdMixin, Base):
    """One lead from a channel: a new Direct conversation or a submitted lead form."""

    __tablename__ = "inbound_leads"
    __table_args__ = (UniqueConstraint("workspace_id", "channel", "external_id"),)

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    channel: Mapped[str] = mapped_column(String(20), default="instagram")
    # message | lead_form
    kind: Mapped[str] = mapped_column(String(20))
    # The sender's Instagram-scoped id for conversations, the leadgen id for forms.
    external_id: Mapped[str] = mapped_column(String(120))
    contact_id: Mapped[str | None] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    deal_id: Mapped[str | None] = mapped_column(ForeignKey("deals.id", ondelete="SET NULL"), index=True, nullable=True)
    ad_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    form_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Ad attribution (Meta lead exports and lead ads): where the lead came from, for the source reports.
    platform: Mapped[str | None] = mapped_column(String(20), nullable=True)
    campaign: Mapped[str | None] = mapped_column(String(200), nullable=True)
    adset: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ad_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    form_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)
    first_response_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
