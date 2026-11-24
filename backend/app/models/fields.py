from typing import Any

from sqlalchemy import JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import TenantMixin


class CustomField(TenantMixin, Base):
    """A workspace-defined deal field (amoCRM / Pipedrive custom fields); values live in `deals.custom[key]`."""

    __tablename__ = "custom_fields"
    __table_args__ = (UniqueConstraint("workspace_id", "entity", "key"),)

    entity: Mapped[str] = mapped_column(String(20), default="deal")
    key: Mapped[str] = mapped_column(String(60))
    label: Mapped[str] = mapped_column(String(80))
    # text | number | select | multiselect | date
    type: Mapped[str] = mapped_column(String(20), default="text")
    options: Mapped[list[Any]] = mapped_column(JSON, default=list)
    # List values that need attention (e.g. a volume below the minimum order), shown in red.
    warn_options: Mapped[list[Any]] = mapped_column(JSON, default=list)
    position: Mapped[int] = mapped_column(default=0)


class LostReason(TenantMixin, Base):
    """Why deals are lost: a fixed list keeps the win/loss report countable (free text cannot be grouped)."""

    __tablename__ = "lost_reasons"

    name: Mapped[str] = mapped_column(String(120))
    position: Mapped[int] = mapped_column(default=0)
