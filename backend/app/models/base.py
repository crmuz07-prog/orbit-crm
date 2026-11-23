import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.core.db import UTCDateTime, utcnow


def new_id() -> str:
    return str(uuid.uuid4())


class IdMixin:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class TenantMixin(IdMixin, TimestampMixin):
    """Every business record belongs to exactly one workspace."""

    @declared_attr
    def workspace_id(cls) -> Mapped[str]:
        return mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
