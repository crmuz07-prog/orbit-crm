from datetime import date, timedelta

from fastapi import APIRouter, Query

from sqlalchemy import select

from app.api.deps import Ctx
from app.api.routes.pipelines import visible_record
from app.models import InboundLead
from app.schemas.reports import Attribution, LeadReport
from app.services import reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/leads", response_model=LeadReport)
def lead_report(ctx: Ctx, pipeline_id: str, date_from: date | None = Query(default=None), date_to: date | None = Query(default=None)) -> LeadReport:
    ctx.access.require("reports", "view")
    end = date_to or date.today()
    start = date_from or end - timedelta(days=29)
    return reports.lead_report(ctx.db, ctx.workspace_id, pipeline_id, start, end, ctx.visibility("reports"))


@router.get("/attribution/{deal_id}", response_model=Attribution | None)
def attribution(deal_id: str, ctx: Ctx) -> InboundLead | None:
    """The lead source shown in the deal card; null for deals created by hand."""
    visible_record(ctx, "deal_id", deal_id)
    query = select(InboundLead).where(InboundLead.workspace_id == ctx.workspace_id, InboundLead.deal_id == deal_id)
    return ctx.db.scalars(query.order_by(InboundLead.created_at)).first()
