from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, UTCDateTime
from app.models.base import OwnedMixin, TenantMixin


def optional_fk(table: str) -> Mapped[str | None]:
    return mapped_column(ForeignKey(f"{table}.id", ondelete="SET NULL"), index=True, nullable=True)


class Pipeline(TenantMixin, Base):
    """A sales process with its own stages (amoCRM "voronka", Pipedrive pipeline)."""

    __tablename__ = "pipelines"

    name: Mapped[str] = mapped_column(String(80))
    position: Mapped[int] = mapped_column(default=0)
    is_default: Mapped[bool] = mapped_column(default=False)


class Stage(TenantMixin, Base):
    __tablename__ = "pipeline_stages"

    pipeline_id: Mapped[str] = mapped_column(ForeignKey("pipelines.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    position: Mapped[int] = mapped_column(default=0)
    probability: Mapped[int] = mapped_column(default=0)
    is_won: Mapped[bool] = mapped_column(default=False)
    is_lost: Mapped[bool] = mapped_column(default=False)
    color: Mapped[str] = mapped_column(String(20), default="slate")
    # The rule shown under the board column, e.g. "a lead may not stay here longer than 24 hours".
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Past this many days in the stage a deal is flagged as overdue (Pipedrive "rotting").
    max_days: Mapped[int | None] = mapped_column(nullable=True)

    @property
    def is_closed(self) -> bool:
        return self.is_won or self.is_lost


class Company(OwnedMixin, Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200))
    domain: Mapped[str | None] = mapped_column(String(200))
    industry: Mapped[str | None] = mapped_column(String(80))
    employees: Mapped[str | None] = mapped_column(String(40))
    country: Mapped[str | None] = mapped_column(String(80))
    city: Mapped[str | None] = mapped_column(String(80))
    annual_revenue: Mapped[float | None]
    lifecycle: Mapped[str] = mapped_column(String(20), default="lead")
    description: Mapped[str | None] = mapped_column(Text)


class Contact(OwnedMixin, Base):
    __tablename__ = "contacts"

    company_id: Mapped[str | None] = optional_fk("companies")
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80), default="")
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(60))
    title: Mapped[str | None] = mapped_column(String(120))
    linkedin_url: Mapped[str | None] = mapped_column(String(300))


class Deal(OwnedMixin, Base):
    __tablename__ = "deals"

    title: Mapped[str] = mapped_column(String(200))
    company_id: Mapped[str | None] = optional_fk("companies")
    contact_id: Mapped[str | None] = optional_fk("contacts")
    stage_id: Mapped[str] = mapped_column(ForeignKey("pipeline_stages.id", ondelete="RESTRICT"), index=True)
    amount: Mapped[float] = mapped_column(default=0)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    expected_close_date: Mapped[date | None] = mapped_column(Date)
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    source: Mapped[str | None] = mapped_column(String(40))
    lost_reason: Mapped[str | None] = mapped_column(Text)
    closed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    stage_entered_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class Activity(OwnedMixin, Base):
    __tablename__ = "activities"

    type: Mapped[str] = mapped_column(String(20))
    subject: Mapped[str] = mapped_column(String(200))
    body: Mapped[str | None] = mapped_column(Text)
    due_at: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)
    done: Mapped[bool] = mapped_column(default=False)
    pinned: Mapped[bool] = mapped_column(default=False)
    remind_at: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)
    # Call log fields (type == "call"), modelled on Close / Aircall call records.
    call_direction: Mapped[str | None] = mapped_column(String(10))
    call_outcome: Mapped[str | None] = mapped_column(String(20))
    duration_seconds: Mapped[int | None]
    phone: Mapped[str | None] = mapped_column(String(60))
    next_steps: Mapped[str | None] = mapped_column(Text)
    # Set when the call was captured by the telephony integration (provider call id is unique per workspace).
    external_id: Mapped[str | None] = mapped_column(String(120), index=True)
    recording_url: Mapped[str | None] = mapped_column(String(500))
    auto_logged: Mapped[bool] = mapped_column(default=False)
    deal_id: Mapped[str | None] = optional_fk("deals")
    company_id: Mapped[str | None] = optional_fk("companies")
    contact_id: Mapped[str | None] = optional_fk("contacts")
