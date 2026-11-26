"""Pipeline analytics for the dashboard (HubSpot / Pipedrive style KPIs)."""

from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import utcnow
from app.models import Deal, Pipeline, Stage
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
            won_count=sum(1 for d in won if in_month(d, m)),
            lost_count=sum(1 for d in lost if in_month(d, m)),
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


def default_pipeline_stages(db: Session, stages: list[Stage]) -> list[Stage]:
    default = db.scalar(select(Pipeline.id).where(Pipeline.workspace_id == stages[0].workspace_id, Pipeline.is_default.is_(True))) if stages else None
    return [s for s in stages if s.pipeline_id == default] or stages


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
    # "Today" is the local calendar day (Tashkent), not the UTC one that starts at 05:00 there.
    day_start = now.astimezone(ZoneInfo(get_settings().billing_timezone)).replace(hour=0, minute=0, second=0, microsecond=0)
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
        # The stage chart is one pipeline (the default); the totals above cover all of them.
        by_stage=stage_totals(default_pipeline_stages(db, stages), open_deals),
        monthly=monthly_totals(won, lost, now),
        stale=[DealOut.model_validate(d) for d in open_deals if d.updated_at <= stale_before and deals_scope.allows(d)],
        top_open=[DealOut.model_validate(d) for d in sorted(filter(deals_scope.allows, open_deals), key=lambda d: -d.amount)[:5]],
        won_count=len(won),
        lost_count=len(lost),
        new_today=sum(1 for d in deals if d.created_at >= day_start),
        new_week=sum(1 for d in deals if d.created_at >= now - timedelta(days=7)),
        recent_open=[DealOut.model_validate(d) for d in sorted(filter(deals_scope.allows, open_deals), key=lambda d: d.created_at, reverse=True)[:5]],
    )
