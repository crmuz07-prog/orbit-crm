from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, String, false, text, true
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, UTCDateTime
from app.models.base import IdMixin, TimestampMixin


class Workspace(IdMixin, TimestampMixin, Base):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(120))
    is_demo: Mapped[bool] = mapped_column(default=False)
    # Subscription (erp1 model, see services/billing.py). Empty end date / seat limit = unlimited.
    status: Mapped[str] = mapped_column(String(20), default="active", server_default="active")
    subscription_ends_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    seat_limit: Mapped[int | None] = mapped_column(nullable=True)
    license_months: Mapped[int] = mapped_column(default=1, server_default=text("1"))
    price_paid: Mapped[float] = mapped_column(default=0, server_default=text("0"))


class User(IdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str | None] = mapped_column(String(255))
    email_verified_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    # Platform operator: manages every company and user (server defaults keep existing rows valid).
    is_superadmin: Mapped[bool] = mapped_column(default=False, server_default=false())
    is_active: Mapped[bool] = mapped_column(default=True, server_default=true())
    # Set for admin-issued temporary passwords; cleared when the user picks their own.
    must_change_password: Mapped[bool] = mapped_column(default=False, server_default=false())
    # Carried in every token; bumping it signs the user out everywhere (admin reset, deactivation, password change).
    session_version: Mapped[int] = mapped_column(default=0, server_default=text("0"))

    @property
    def email_verified(self) -> bool:
        return self.email_verified_at is not None

    @property
    def has_password(self) -> bool:
        return self.password_hash is not None


class Membership(TimestampMixin, Base):
    __tablename__ = "memberships"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    # Members only: which permission set applies (owners and admins have full access) and their sales team.
    access_role_id: Mapped[str | None] = mapped_column(ForeignKey("access_roles.id", ondelete="SET NULL"), nullable=True)
    team_id: Mapped[str | None] = mapped_column(ForeignKey("sales_teams.id", ondelete="SET NULL"), index=True, nullable=True)
