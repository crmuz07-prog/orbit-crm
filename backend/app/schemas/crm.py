from datetime import date, datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import RowRead, Schema, partial

StageColor = Literal["slate", "blue", "violet", "amber", "orange", "emerald", "rose"]
Lifecycle = Literal["lead", "prospect", "customer", "churned"]
Priority = Literal["low", "medium", "high"]
ActivityType = Literal["note", "call", "email", "meeting", "task"]
CallDirection = Literal["outbound", "inbound"]
CallOutcome = Literal["connected", "no_answer", "voicemail", "busy", "wrong_number"]

Name = Field(min_length=1, max_length=200)


class StageIn(Schema):
    name: str = Name
    position: int = 0
    probability: int = Field(default=0, ge=0, le=100)
    is_won: bool = False
    is_lost: bool = False
    color: StageColor = "slate"


class CompanyIn(Schema):
    owner_id: str | None = None
    name: str = Name
    domain: str | None = None
    industry: str | None = None
    employees: str | None = None
    country: str | None = None
    city: str | None = None
    annual_revenue: float | None = Field(default=None, ge=0)
    lifecycle: Lifecycle = "lead"
    description: str | None = None


class ContactIn(Schema):
    owner_id: str | None = None
    company_id: str | None = None
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = ""
    email: str | None = None
    phone: str | None = None
    title: str | None = None
    linkedin_url: str | None = None


class DealIn(Schema):
    owner_id: str | None = None
    title: str = Name
    company_id: str | None = None
    contact_id: str | None = None
    stage_id: str
    amount: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    expected_close_date: date | None = None
    priority: Priority = "medium"
    source: str | None = None
    lost_reason: str | None = None


class ActivityIn(Schema):
    owner_id: str | None = None
    type: ActivityType
    subject: str = Name
    body: str | None = None
    due_at: datetime | None = None
    done: bool = False
    pinned: bool = False
    remind_at: datetime | None = None
    call_direction: CallDirection | None = None
    call_outcome: CallOutcome | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    phone: str | None = None
    next_steps: str | None = None
    recording_url: str | None = None
    deal_id: str | None = None
    company_id: str | None = None
    contact_id: str | None = None


StagePatch = partial(StageIn, "StagePatch")
CompanyPatch = partial(CompanyIn, "CompanyPatch")
ContactPatch = partial(ContactIn, "ContactPatch")
DealPatch = partial(DealIn, "DealPatch")
ActivityPatch = partial(ActivityIn, "ActivityPatch")


class StageOut(StageIn, RowRead):
    pass


class CompanyOut(CompanyIn, RowRead):
    pass


class ContactOut(ContactIn, RowRead):
    pass


class DealOut(DealIn, RowRead):
    closed_at: datetime | None


class ActivityOut(ActivityIn, RowRead):
    external_id: str | None = None
    auto_logged: bool = False
