from datetime import datetime
from typing import Any

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, UTCDateTime, utcnow
from app.models.base import IdMixin


class RecordEvent(IdMixin, Base):
    """What happened to a record and who did it — the system lines of the record feed (amoCRM / HubSpot history)."""

    __tablename__ = "record_events"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    deal_id: Mapped[str | None] = mapped_column(ForeignKey("deals.id", ondelete="CASCADE"), index=True, nullable=True)
    company_id: Mapped[str | None] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=True)
    contact_id: Mapped[str | None] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"), index=True, nullable=True)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # created | updated | stage_changed
    kind: Mapped[str] = mapped_column(String(20))
    # [{"field": ..., "old": ..., "new": ...}] for updates; {"from": stage id, "to": stage id} for stage changes.
    changes: Mapped[Any] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)
