"""Lead / sales report for a period and pipeline: the client's spreadsheet report, computed from CRM records
(funnel by stage, sources, campaigns, ad sets, list fields, loss reasons and managers)."""

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Activity, CustomField, Deal, InboundLead, Stage
from app.schemas.reports import Breakdown, GroupRow, LeadReport, StageRow, Totals
from app.services.custom_fields import fields_for
from app.services.importer.values import local_zone
from app.services.team import members
from app.services.visibility import Visibility

ATTRIBUTION = ("platform", "campaign", "adset", "ad_name")


def local_day_range(start: date, end: date) -> tuple[datetime, datetime]:
    zone = local_zone()
    return datetime.combine(start, time(), zone), datetime.combine(end + timedelta(days=1), time(), zone)


def has_warning(deal: Deal, fields: list[CustomField]) -> bool:
    for f in fields:
        value = (deal.custom or {}).get(f.key)
        values = value if isinstance(value, list) else [value]
        if any(v in f.warn_options for v in values if v is not None):
            return True
    return False


def group(deals: list[Deal], stages: dict[str, Stage], label_of: Any) -> list[GroupRow]:
    """Totals per label; a deal with several labels (multi-list values) counts once in each."""
    counts: dict[str | None, dict[str, int]] = defaultdict(lambda: {"total": 0, "open": 0, "won": 0, "lost": 0})
    for deal in deals:
        stage = stages[deal.stage_id]
        labels = label_of(deal)
        for label in (labels if isinstance(labels, list) and labels else [labels if not isinstance(labels, list) else None]):
            c = counts[label]
            c["total"] += 1
            c["won" if stage.is_won else "lost" if stage.is_lost else "open"] += 1
    rows = [GroupRow(label=label, **c) for label, c in counts.items()]
    return sorted(rows, key=lambda r: (r.label is None, -r.total))


def task_totals(db: Session, workspace_id: str, deals: list[Deal], stages: dict[str, Stage]) -> dict[str, int]:
    open_ids = {d.id for d in deals if not stages[d.stage_id].is_closed}
    query = select(Activity.deal_id, Activity.due_at).where(
        Activity.workspace_id == workspace_id, Activity.done.is_(False), Activity.due_at.is_not(None), Activity.deal_id.in_(open_ids))
    tasks = db.execute(query).all()
    now, zone = utcnow(), local_zone()
    today = now.astimezone(zone).date()
    return {
        "tasks_overdue": sum(1 for _, due in tasks if due < now),
        "tasks_today": sum(1 for _, due in tasks if due >= now and due.astimezone(zone).date() == today),
        "no_task": len(open_ids - {deal_id for deal_id, _ in tasks}),
    }


def lead_report(db: Session, workspace_id: str, pipeline_id: str, start: date, end: date, visible: Visibility) -> LeadReport:
    stage_list = list(db.scalars(select(Stage).where(Stage.workspace_id == workspace_id, Stage.pipeline_id == pipeline_id).order_by(Stage.position)))
    stages = {s.id: s for s in stage_list}
    since, until = local_day_range(start, end)
    query = select(Deal).where(Deal.workspace_id == workspace_id, Deal.stage_id.in_(stages), Deal.created_at >= since, Deal.created_at < until)
    deals = [d for d in db.scalars(query) if visible.allows(d)]
    leads = {lead.deal_id: lead for lead in db.scalars(select(InboundLead).where(InboundLead.deal_id.in_([d.id for d in deals])))}
    fields = fields_for(db, workspace_id)
    warned = {d.id for d in deals if has_warning(d, fields)}
    names = {m.user_id: u.full_name for m, u in members(db, workspace_id)}

    won = [d for d in deals if stages[d.stage_id].is_won]
    lost = sum(1 for d in deals if stages[d.stage_id].is_lost)
    totals = Totals(total=len(deals), won=len(won), lost=lost, open=len(deals) - len(won) - lost, won_value=sum(d.amount for d in won),
                    conversion=len(won) / len(deals) * 100 if deals else 0, warnings=len(warned),
                    **task_totals(db, workspace_id, deals, stages))
    funnel = [StageRow(stage_id=s.id, name=s.name, color=s.color, is_won=s.is_won, is_lost=s.is_lost,
                       count=sum(1 for d in deals if d.stage_id == s.id), share=0, warnings=sum(1 for d in deals if d.stage_id == s.id and d.id in warned))
              for s in stage_list]
    for row in funnel:
        row.share = row.count / len(deals) * 100 if deals else 0

    breakdowns = [Breakdown(key="owner", rows=group(deals, stages, lambda d: names.get(d.owner_id or "")))]
    for key in ATTRIBUTION:
        breakdowns.append(Breakdown(key=key, rows=group(deals, stages, lambda d, k=key: getattr(leads.get(d.id), k, None))))
    breakdowns.append(Breakdown(key="source", rows=group(deals, stages, lambda d: d.source)))
    for f in fields:
        if f.type in ("select", "multiselect"):
            breakdowns.append(Breakdown(key=f"custom:{f.key}", label=f.label, rows=group(deals, stages, lambda d, k=f.key: (d.custom or {}).get(k))))
    lost_deals = [d for d in deals if stages[d.stage_id].is_lost]
    breakdowns.append(Breakdown(key="lost_reason", rows=group(lost_deals, stages, lambda d: d.lost_reason)))
    return LeadReport(totals=totals, stages=funnel, breakdowns=[b for b in breakdowns if any(r.label for r in b.rows)])
