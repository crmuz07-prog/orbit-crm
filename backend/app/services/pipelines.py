"""Multiple pipelines per workspace (amoCRM voronkalar): each with its own stages, won and lost included."""

from datetime import timedelta

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.errors import Conflict, NotFound
from app.models import Deal, Pipeline, RecordEvent, Stage
from app.schemas.pipelines import StageMovementOut
from app.services.history import stage_segments
from app.services.onboarding import default_stages
from app.services.visibility import Visibility


def get(db: Session, workspace_id: str, pipeline_id: str) -> Pipeline:
    pipeline = db.get(Pipeline, pipeline_id)
    if pipeline is None or pipeline.workspace_id != workspace_id:
        raise NotFound("Pipeline not found", "not_found")
    return pipeline


def list_pipelines(db: Session, workspace_id: str) -> list[Pipeline]:
    return list(db.scalars(select(Pipeline).where(Pipeline.workspace_id == workspace_id).order_by(Pipeline.position, Pipeline.created_at)))


def create(db: Session, workspace_id: str, name: str) -> Pipeline:
    position = len(list_pipelines(db, workspace_id))
    pipeline = Pipeline(workspace_id=workspace_id, name=name, position=position)
    db.add(pipeline)
    db.flush()
    db.add_all(default_stages(workspace_id, pipeline.id))
    db.commit()
    return pipeline


def change(db: Session, workspace_id: str, pipeline_id: str, changes: dict[str, object]) -> Pipeline:
    pipeline = get(db, workspace_id, pipeline_id)
    if changes.pop("is_default", None):
        db.execute(update(Pipeline).where(Pipeline.workspace_id == workspace_id).values(is_default=False))
        pipeline.is_default = True
    for field, value in changes.items():
        if value is not None:
            setattr(pipeline, field, value)
    db.commit()
    return pipeline


def delete(db: Session, workspace_id: str, pipeline_id: str) -> None:
    pipeline = get(db, workspace_id, pipeline_id)
    if pipeline.is_default:
        raise Conflict("The default pipeline cannot be deleted", "default_pipeline")
    deals = db.scalar(select(func.count()).select_from(Deal).join(Stage, Stage.id == Deal.stage_id).where(Stage.pipeline_id == pipeline.id))
    if deals:
        raise Conflict("Move the deals out of this pipeline before deleting it", "pipeline_has_deals")
    db.delete(pipeline)
    db.commit()


def movement(db: Session, workspace_id: str, pipeline_id: str, days: int, visible: Visibility) -> list[StageMovementOut]:
    """Per stage: deals there now, deals that entered in the period and the average time spent (amoCRM movement report)."""
    get(db, workspace_id, pipeline_id)
    stages = list(db.scalars(select(Stage).where(Stage.pipeline_id == pipeline_id).order_by(Stage.position)))
    stage_ids = {s.id for s in stages}
    deals = list(db.scalars(select(Deal).where(Deal.workspace_id == workspace_id, Deal.stage_id.in_(stage_ids), visible.where(Deal))))
    events = db.scalars(select(RecordEvent).where(RecordEvent.deal_id.in_([d.id for d in deals])).order_by(RecordEvent.created_at))
    by_deal: dict[str, list[RecordEvent]] = {}
    for event in events:
        by_deal.setdefault(event.deal_id or "", []).append(event)

    since = utcnow() - timedelta(days=days)
    entered: dict[str, int] = {s: 0 for s in stage_ids}
    spent: dict[str, list[float]] = {s: [] for s in stage_ids}
    for deal in deals:
        for stage, start, end in stage_segments(deal, by_deal.get(deal.id, [])):
            if stage in stage_ids and start >= since:
                entered[stage] += 1
            if stage in stage_ids and end >= since:
                spent[stage].append((end - start).total_seconds())
    return [
        StageMovementOut(stage_id=s.id, deals_now=sum(1 for d in deals if d.stage_id == s.id), entered=entered[s.id],
                         avg_seconds=sum(spent[s.id]) / len(spent[s.id]) if spent[s.id] else None)
        for s in stages
    ]
