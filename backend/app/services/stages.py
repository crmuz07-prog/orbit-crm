"""Deleting a pipeline stage: the pipeline keeps a won and a lost stage, and the stage's deals move first."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import BadRequest, Conflict
from app.models import Deal, Stage
from app.services import crud, history
from app.services.rules import apply_deal_stage_rules, ensure_not_last_closed


def _target(db: Session, stage: Stage, move_to: str) -> Stage:
    target = crud.get_row(db, Stage, stage.workspace_id, move_to)
    if target.id == stage.id or target.pipeline_id != stage.pipeline_id:
        raise BadRequest("Move the deals to another stage of the same pipeline", "stage_move_target")
    return target


def _move(db: Session, deal: Deal, source: Stage, target: Stage, actor_id: str) -> None:
    """A stage change like any other (feed line, stage timing). Between two stages of the same closed kind (merging
    duplicate "lost" stages) the deal keeps its close date and reason — reports by close date must not shift."""
    before = history.snapshot(deal, {"stage_id"})
    closed_at, reason = deal.closed_at, deal.lost_reason
    deal.stage_id = target.id
    apply_deal_stage_rules(db, deal, {"stage_id"})
    if source.is_closed and (source.is_won, source.is_lost) == (target.is_won, target.is_lost):
        deal.closed_at, deal.lost_reason = closed_at, reason
    db.commit()
    history.updated(db, deal, actor_id, before)


def delete_stage(db: Session, workspace_id: str, stage_id: str, move_to: str | None, actor_id: str) -> None:
    stage = crud.get_row(db, Stage, workspace_id, stage_id)
    ensure_not_last_closed(db, stage)
    deals = list(db.scalars(select(Deal).where(Deal.workspace_id == workspace_id, Deal.stage_id == stage.id)))
    if deals and not move_to:
        raise Conflict("Move the deals out of this stage before deleting it", "stage_has_deals")
    if deals and move_to:
        target = _target(db, stage, move_to)
        for deal in deals:
            _move(db, deal, stage, target, actor_id)
    db.delete(stage)
    db.commit()
