"""Instagram lead analytics: volume by day and kind, conversion to won deals, speed of the first reply, best ads."""

from collections import Counter, defaultdict
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Deal, InboundLead, Stage
from app.schemas.instagram import AdStat, DayStat, InstagramStats
from app.services.visibility import Visibility


def stats(db: Session, workspace_id: str, days: int, visible: Visibility) -> InstagramStats:
    since = utcnow() - timedelta(days=days)
    query = (
        select(InboundLead, Deal, Stage)
        .outerjoin(Deal, Deal.id == InboundLead.deal_id).outerjoin(Stage, Stage.id == Deal.stage_id)
        .where(InboundLead.workspace_id == workspace_id, InboundLead.channel == "instagram", InboundLead.created_at >= since)
    )
    rows = [(lead, deal, stage) for lead, deal, stage in db.execute(query).all() if deal is None or visible.allows(deal)]
    won = [lead for lead, _, stage in rows if stage is not None and stage.is_won]
    replies = [(lead.first_response_at - lead.created_at).total_seconds() for lead, _, _ in rows if lead.first_response_at]

    per_day: dict[str, Counter[str]] = defaultdict(Counter)
    for lead, _, _ in rows:
        per_day[lead.created_at.date().isoformat()][lead.kind] += 1
    ads: dict[str, Counter[str]] = defaultdict(Counter)
    won_ids = {lead.id for lead in won}
    for lead, _, _ in rows:
        if lead.ad_id:
            ads[lead.ad_id]["leads"] += 1
            ads[lead.ad_id]["won"] += lead.id in won_ids

    return InstagramStats(
        leads=len(rows),
        messages=sum(1 for lead, _, _ in rows if lead.kind == "message"),
        lead_forms=sum(1 for lead, _, _ in rows if lead.kind == "lead_form"),
        won=len(won),
        conversion=len(won) / len(rows) * 100 if rows else 0,
        avg_first_response_seconds=sum(replies) / len(replies) if replies else None,
        unanswered=sum(1 for lead, _, _ in rows if lead.kind == "message" and lead.first_response_at is None),
        per_day=[DayStat(date=d, messages=c["message"], lead_forms=c["lead_form"]) for d, c in sorted(per_day.items())],
        top_ads=sorted((AdStat(ad_id=a, leads=c["leads"], won=c["won"]) for a, c in ads.items()), key=lambda a: -a.leads)[:5],
    )
