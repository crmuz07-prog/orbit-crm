from datetime import datetime
from typing import Any

from sqlalchemy import JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, UTCDateTime, utcnow
from app.models.base import IdMixin, TenantMixin


class AccessRole(TenantMixin, Base):
    """A named permission set (erp1 role template, Salesforce profile). Members point to it, so edits apply at once."""

    __tablename__ = "access_roles"
    __table_args__ = (UniqueConstraint("workspace_id", "name"),)

    name: Mapped[str] = mapped_column(String(80))
    # {module: {view, create, edit, delete, export: bool, scope: own|team|all}} — see services/permissions.py.
    permissions: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    # Given to new members and to members of a deleted role; exactly one per workspace.
    is_default: Mapped[bool] = mapped_column(default=False)


class SalesTeam(TenantMixin, Base):
    __tablename__ = "sales_teams"
    __table_args__ = (UniqueConstraint("workspace_id", "name"),)

    name: Mapped[str] = mapped_column(String(80))


class LoginAttempt(IdMixin, Base):
    """Sign-in audit and the data behind the rate limit."""

    __tablename__ = "login_attempts"

    email: Mapped[str] = mapped_column(String(255), index=True)
    ip: Mapped[str | None] = mapped_column(String(64))
    success: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)
