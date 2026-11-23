"""Business rules plugged into the generic CRUD as hooks."""

from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import Conflict
from app.models import Deal, Stage
from app.services.crud import count_rows


def apply_deal_stage_rules(db: Session, deal: Deal, changed: set[str]) -> None:
    """Keeps closed_at / lost_reason consistent with the kind of stage the deal is in."""
    if "stage_id" not in changed:
        return
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


def guard_stage_delete(db: Session, stage: Stage) -> None:
    if count_rows(db, Deal, stage_id=stage.id):
        raise Conflict("Move the deals out of this stage before deleting it", "stage_has_deals")
