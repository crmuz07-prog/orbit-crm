from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.schemas.base import Schema

PipelineName = Field(min_length=1, max_length=80)


class PipelineOut(Schema):
    id: str
    name: str
    position: int
    is_default: bool


class PipelineIn(Schema):
    name: str = PipelineName


class PipelinePatch(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    position: int | None = None
    # Only `true` is meaningful: making another pipeline the default unsets the previous one.
    is_default: bool | None = None


class EventOut(Schema):
    id: str
    kind: Literal["created", "updated", "stage_changed"]
    changes: Any
    actor_id: str | None
    created_at: datetime


class StageTimeOut(Schema):
    stage_id: str
    seconds: float


class StageMovementOut(Schema):
    stage_id: str
    deals_now: int
    entered: int
    avg_seconds: float | None
