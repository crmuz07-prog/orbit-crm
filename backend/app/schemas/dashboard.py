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
    # Counts too: workspaces that do not enter amounts still see how many deals were won and lost.
    won_count: int = 0
    lost_count: int = 0


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
    won_count: int = 0
    lost_count: int = 0
    # New deals (leads) created today and in the last 7 days.
    new_today: int = 0
    new_week: int = 0
    # The newest open deals — the list to show when deals carry no amounts.
    recent_open: list[DealOut] = []
