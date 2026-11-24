from datetime import datetime

from app.schemas.base import Schema


class Totals(Schema):
    total: int = 0
    open: int = 0
    won: int = 0
    lost: int = 0
    won_value: float = 0
    conversion: float = 0
    # Deals with a value flagged in red (e.g. below the minimum order).
    warnings: int = 0
    tasks_overdue: int = 0
    tasks_today: int = 0
    no_task: int = 0


class StageRow(Schema):
    stage_id: str
    name: str
    color: str
    is_won: bool
    is_lost: bool
    count: int
    share: float
    warnings: int


class GroupRow(Schema):
    label: str | None
    total: int
    open: int
    won: int
    lost: int


class Breakdown(Schema):
    # owner | platform | campaign | adset | ad_name | lost_reason | source | custom:<key>
    key: str
    label: str | None = None
    rows: list[GroupRow]


class LeadReport(Schema):
    totals: Totals
    stages: list[StageRow]
    breakdowns: list[Breakdown]


class Attribution(Schema):
    """Where a deal's lead came from (Meta lead form / import)."""

    channel: str
    platform: str | None = None
    campaign: str | None = None
    adset: str | None = None
    ad_name: str | None = None
    form_name: str | None = None
    ad_id: str | None = None
    form_id: str | None = None
    created_at: datetime
