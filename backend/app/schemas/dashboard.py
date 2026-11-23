from app.schemas.base import Schema
from app.schemas.crm import DealOut


class StageTotal(Schema):
    id: str
    name: str
    color: str
    count: int
    value: float


class MonthTotal(Schema):
    month: str
    won: float
    lost: float


class DashboardOut(Schema):
    open_count: int
    open_value: float
    weighted_value: float
    won_this_quarter_value: float
    won_this_quarter_count: int
    win_rate: float
    avg_deal_size: float
    avg_cycle_days: int
    by_stage: list[StageTotal]
    monthly: list[MonthTotal]
    stale: list[DealOut]
    top_open: list[DealOut]
