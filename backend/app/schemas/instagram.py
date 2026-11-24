from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import Schema


class InstagramSettingsOut(Schema):
    webhook_path: str
    verify_token: str
    ig_account_id: str | None
    stage_id: str | None
    owner_id: str | None
    # Secrets are write-only: only whether they are set is ever returned.
    has_app_secret: bool
    has_access_token: bool
    last_event_at: datetime | None


class InstagramSettingsPatch(Schema):
    app_secret: str | None = Field(default=None, max_length=200)
    access_token: str | None = Field(default=None, max_length=1000)
    ig_account_id: str | None = Field(default=None, max_length=64)
    stage_id: str | None = None
    owner_id: str | None = None


class ReplyIn(Schema):
    contact_id: str
    text: str = Field(min_length=1, max_length=1000)


class SimulateIn(Schema):
    kind: Literal["message", "lead_form"]
    name: str = Field(default="Instagram mijoz", max_length=120)
    username: str | None = Field(default=None, max_length=100)
    text: str = Field(default="Assalomu alaykum! Narxi qancha?", max_length=1000)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=200)
    ad_id: str | None = Field(default=None, max_length=64)


class DayStat(Schema):
    date: str
    messages: int
    lead_forms: int


class AdStat(Schema):
    ad_id: str
    leads: int
    won: int


class InstagramStats(Schema):
    leads: int
    messages: int
    lead_forms: int
    won: int
    conversion: float
    avg_first_response_seconds: float | None
    unanswered: int
    per_day: list[DayStat]
    top_ads: list[AdStat]
