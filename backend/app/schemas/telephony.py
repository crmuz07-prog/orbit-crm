from datetime import datetime, timedelta, timezone
from typing import Literal

from pydantic import ConfigDict, Field, field_validator

from app.core.db import utcnow
from app.schemas.base import Schema
from app.schemas.crm import ActivityOut, CallDirection, WebUrl

REPLAY_WINDOW = timedelta(hours=24)
CLOCK_SKEW = timedelta(minutes=10)

CallEventType = Literal["call.ringing", "call.answered", "call.ended", "call.missed"]
ProviderStatus = Literal["answered", "no_answer", "busy", "voicemail", "failed"]


class TelephonyEventIn(Schema):
    """Provider-agnostic call event. A PBX adapter only has to map its payload onto this shape."""

    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True, populate_by_name=True)

    event: CallEventType
    call_id: str = Field(min_length=1, max_length=120)
    direction: CallDirection
    from_: str = Field(alias="from", min_length=3, max_length=40)
    to: str = Field(min_length=3, max_length=40)
    duration: int = Field(default=0, ge=0, le=24 * 3600)
    status: ProviderStatus | None = None
    recording_url: WebUrl = Field(default=None, max_length=500)
    timestamp: datetime | None = None

    @field_validator("timestamp")
    @classmethod
    def recent(cls, value: datetime | None) -> datetime | None:
        """A signed body can be captured and re-sent; an old or future-dated one is refused (providers retry for hours)."""
        if value is None:
            return value
        moment = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if not utcnow() - REPLAY_WINDOW <= moment <= utcnow() + CLOCK_SKEW:
            raise ValueError("Event timestamp is outside the accepted window")
        return value

    @property
    def customer_phone(self) -> str:
        return self.from_ if self.direction == "inbound" else self.to


class TelephonySettingsOut(Schema):
    webhook_path: str
    signing_secret: str
    create_unknown_contacts: bool
    callback_task_on_missed: bool


class TelephonySettingsPatch(Schema):
    create_unknown_contacts: bool | None = None
    callback_task_on_missed: bool | None = None


class SimulateIn(Schema):
    action: Literal["start", "end"]
    call_id: str | None = None
    phone: str = Field(min_length=3, max_length=40)
    direction: CallDirection = "inbound"
    status: ProviderStatus = "answered"
    duration: int = Field(default=0, ge=0)


class CallEventOut(Schema):
    """Pushed to the browser over SSE."""

    type: Literal["ringing", "answered", "ended"]
    call: ActivityOut
    contact_name: str | None
    company_name: str | None
    deal_title: str | None
