from datetime import datetime

from pydantic import Field

from app.schemas.base import Schema
from app.schemas.crm import ActivityOut, CallDirection, CallOutcome


class FollowUpIn(Schema):
    subject: str = Field(min_length=1, max_length=200)
    due_at: datetime
    remind_at: datetime | None = None


class CallLogIn(Schema):
    """One logged phone call; what was discussed goes in `summary`."""

    subject: str = Field(default="Call", min_length=1, max_length=200)
    direction: CallDirection = "outbound"
    outcome: CallOutcome
    duration_seconds: int = Field(default=0, ge=0, le=24 * 3600)
    phone: str | None = None
    summary: str | None = None
    next_steps: str | None = None
    called_at: datetime | None = None
    deal_id: str | None = None
    company_id: str | None = None
    contact_id: str | None = None
    follow_up: FollowUpIn | None = None


class CallLogOut(Schema):
    call: ActivityOut
    follow_up: ActivityOut | None


class OutcomeCount(Schema):
    outcome: CallOutcome
    count: int


class CallStatsOut(Schema):
    today: int
    this_week: int
    connect_rate: float
    avg_duration_seconds: int
    talk_time_seconds: int
    by_outcome: list[OutcomeCount]
