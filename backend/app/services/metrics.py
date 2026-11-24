"""Pipeline analytics for the dashboard (HubSpot / Pipedrive style KPIs)."""

from collections.abc import Iterable
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Deal, Stage
from app.schemas.dashboard import DashboardOut, MonthTotal, StageTotal
from app.schemas.crm import DealOut
from app.services.visibility import Visibility

STALE_AFTER_DAYS = 14


def total(deals: Iterable[Deal]) -> float:
    return sum(d.amount for d in deals)


def quarter_start(now: datetime) -> datetime:
    return datetime(now.year, 3 * ((now.month - 1) // 3) + 1, 1, tzinfo=UTC)


def month_start(now: datetime, months_back: int) -> datetime:
    index = now.year * 12 + now.month - 1 - months_back
    return datetime(index // 12, index % 12 + 1, 1, tzinfo=UTC)


def monthly_totals(won: list[Deal], lost: list[Deal], now: datetime) -> list[MonthTotal]:
    def in_month(deal: Deal, start: datetime) -> bool:
        return deal.closed_at is not None and (deal.closed_at.year, deal.closed_at.month) == (start.year, start.month)

    months = [month_start(now, back) for back in range(5, -1, -1)]
    return [
        MonthTotal(
            month=m.strftime("%Y-%m"),
            won=total(d for d in won if in_month(d, m)),
            lost=total(d for d in lost if in_month(d, m)),
        )
        for m in months
    ]


def stage_totals(stages: list[Stage], open_deals: list[Deal]) -> list[StageTotal]:
    return [
        StageTotal(
            id=s.id, name=s.name, color=s.color,
            count=sum(1 for d in open_deals if d.stage_id == s.id),
            value=total(d for d in open_deals if d.stage_id == s.id),
        )
        for s in stages
        if not s.is_closed
    ]


def average_cycle_days(won: list[Deal]) -> int:
    cycles = [(d.closed_at - d.created_at).days for d in won if d.closed_at]
    return round(sum(cycles) / len(cycles)) if cycles else 0


def build_dashboard(db: Session, workspace_id: str, reports: Visibility, deals_scope: Visibility) -> DashboardOut:
    """Figures follow the `reports` scope; deal cards listed on it also need to be visible under `deals`."""
    now = utcnow()
    stages = list(db.scalars(select(Stage).where(Stage.workspace_id == workspace_id).order_by(Stage.position)))
    deals = list(db.scalars(select(Deal).where(Deal.workspace_id == workspace_id, reports.where(Deal))))
    by_id = {s.id: s for s in stages}

    open_deals = [d for d in deals if not by_id[d.stage_id].is_closed]
    won = [d for d in deals if by_id[d.stage_id].is_won]
    lost = [d for d in deals if by_id[d.stage_id].is_lost]
    won_quarter = [d for d in won if d.closed_at and d.closed_at >= quarter_start(now)]
    stale_before = now - timedelta(days=STALE_AFTER_DAYS)
    closed_count = len(won) + len(lost)

    return DashboardOut(
        open_count=len(open_deals),
        open_value=total(open_deals),
        weighted_value=sum(d.amount * by_id[d.stage_id].probability / 100 for d in open_deals),
        won_this_quarter_value=total(won_quarter),
        won_this_quarter_count=len(won_quarter),
        win_rate=len(won) / closed_count * 100 if closed_count else 0,
        avg_deal_size=total(won) / len(won) if won else 0,
        avg_cycle_days=average_cycle_days(won),
        by_stage=stage_totals(stages, open_deals),
        monthly=monthly_totals(won, lost, now),
        stale=[DealOut.model_validate(d) for d in open_deals if d.updated_at <= stale_before and deals_scope.allows(d)],
        top_open=[DealOut.model_validate(d) for d in sorted(filter(deals_scope.allows, open_deals), key=lambda d: -d.amount)[:5]],
    )
