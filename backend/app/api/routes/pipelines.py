"""Pipelines, record history (feed events), time in stages and the deal movement report."""

from fastapi import APIRouter, Query, status

from app.api.deps import AdminCtx, Ctx, RequestContext
from app.core.errors import DomainError
from app.models import Company, Contact, Deal
from app.models.base import OwnedMixin
from app.schemas.pipelines import EventOut, PipelineIn, PipelineOut, PipelinePatch, StageMovementOut, StageTimeOut
from app.services import crud, history, pipelines, stages
from app.services.permissions import Module
from app.services.visibility import ensure_visible

router = APIRouter(tags=["pipelines"])

# Which record a feed belongs to: query parameter → (model, permission module, event column).
TARGETS: dict[str, tuple[type[OwnedMixin], Module]] = {"deal_id": (Deal, "deals"), "company_id": (Company, "companies"), "contact_id": (Contact, "contacts")}


def visible_record(ctx: RequestContext, link: str, record_id: str) -> OwnedMixin:
    model, module = TARGETS[link]
    ctx.access.require(module, "view")
    row = crud.get_row(ctx.db, model, ctx.workspace_id, record_id)
    ensure_visible(row, ctx.visibility(module))
    return row


@router.get("/pipelines", response_model=list[PipelineOut])
def list_pipelines(ctx: Ctx) -> list[PipelineOut]:
    return [PipelineOut.model_validate(p) for p in pipelines.list_pipelines(ctx.db, ctx.workspace_id)]


@router.post("/pipelines", response_model=PipelineOut, status_code=status.HTTP_201_CREATED)
def create_pipeline(payload: PipelineIn, ctx: AdminCtx) -> PipelineOut:
    """A new pipeline starts with the standard stages, won and lost included."""
    return PipelineOut.model_validate(pipelines.create(ctx.db, ctx.workspace_id, payload.name))


@router.patch("/pipelines/{pipeline_id}", response_model=PipelineOut)
def update_pipeline(pipeline_id: str, payload: PipelinePatch, ctx: AdminCtx) -> PipelineOut:
    return PipelineOut.model_validate(pipelines.change(ctx.db, ctx.workspace_id, pipeline_id, payload.model_dump(exclude_unset=True)))


@router.delete("/pipelines/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(pipeline_id: str, ctx: AdminCtx) -> None:
    pipelines.delete(ctx.db, ctx.workspace_id, pipeline_id)


@router.delete("/pipelines/stages/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stage(stage_id: str, ctx: AdminCtx, move_to: str | None = Query(default=None, max_length=36)) -> None:
    """Deletes a stage; its deals first move to `move_to` (a stage of the same pipeline), each with a feed line."""
    stages.delete_stage(ctx.db, ctx.workspace_id, stage_id, move_to, ctx.user.id)


@router.get("/events", response_model=list[EventOut])
def events(ctx: Ctx, deal_id: str | None = None, company_id: str | None = None, contact_id: str | None = None) -> list[EventOut]:
    """History of one record, oldest first; the caller must be able to see that record."""
    given = {k: v for k, v in {"deal_id": deal_id, "company_id": company_id, "contact_id": contact_id}.items() if v}
    if len(given) != 1:
        raise DomainError("Pass exactly one of deal_id, company_id, contact_id", "invalid_request")
    link, record_id = next(iter(given.items()))
    visible_record(ctx, link, record_id)
    return [EventOut.model_validate(e) for e in history.events_for(ctx.db, ctx.workspace_id, link, record_id)]


@router.get("/deals/{deal_id}/stage-times", response_model=list[StageTimeOut])
def stage_times(deal_id: str, ctx: Ctx) -> list[StageTimeOut]:
    deal = visible_record(ctx, "deal_id", deal_id)
    times = history.stage_times(deal, history.events_for(ctx.db, ctx.workspace_id, "deal_id", deal_id))  # type: ignore[arg-type]
    return [StageTimeOut(stage_id=s, seconds=v) for s, v in times.items()]


@router.get("/reports/deal-movement", response_model=list[StageMovementOut])
def deal_movement(ctx: Ctx, pipeline_id: str, days: int = Query(default=30, ge=1, le=365)) -> list[StageMovementOut]:
    ctx.access.require("reports", "view")
    return pipelines.movement(ctx.db, ctx.workspace_id, pipeline_id, days, ctx.visibility("reports"))
