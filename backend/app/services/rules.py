"""Business rules plugged into the generic CRUD as hooks."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import Conflict
from app.models import Deal, Stage
from app.services.crud import count_rows
from app.services.custom_fields import clean_custom


def apply_deal_stage_rules(db: Session, deal: Deal, changed: set[str]) -> None:
    """Keeps closed_at / lost_reason consistent with the kind of stage the deal is in, and times the stage."""
    if "stage_id" not in changed:
        return
    deal.stage_entered_at = utcnow()
    stage = db.get(Stage, deal.stage_id)
    if stage is None:
        return
    if not stage.is_closed:
        deal.closed_at = None
        deal.lost_reason = None
        return
    deal.closed_at = utcnow()
    if stage.is_won:
        deal.lost_reason = None


def before_deal_save(db: Session, deal: Deal, changed: set[str]) -> None:
    apply_deal_stage_rules(db, deal, changed)
    if "custom" in changed:
        clean_custom(db, deal)


def ensure_not_last_closed(db: Session, stage: Stage) -> None:
    """Won / lost drop zones, win rate and lost reasons need one won and one lost stage in every pipeline."""
    if not stage.is_closed:
        return
    kind = Stage.is_won if stage.is_won else Stage.is_lost
    others = db.scalar(select(func.count()).select_from(Stage).where(
        Stage.workspace_id == stage.workspace_id, Stage.pipeline_id == stage.pipeline_id, kind.is_(True), Stage.id != stage.id))
    if not others:
        raise Conflict("A pipeline keeps at least one won and one lost stage", "last_won_stage" if stage.is_won else "last_lost_stage")


def guard_stage_delete(db: Session, stage: Stage) -> None:
    ensure_not_last_closed(db, stage)
    if count_rows(db, Deal, stage_id=stage.id):
        raise Conflict("Move the deals out of this stage before deleting it", "stage_has_deals")
