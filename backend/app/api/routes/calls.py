from fastapi import APIRouter

from app.api.deps import Ctx
from app.schemas.calls import CallLogIn, CallLogOut, CallStatsOut
from app.schemas.crm import ActivityOut
from app.services import calls

router = APIRouter(tags=["calls"])


@router.post("/calls", response_model=CallLogOut, status_code=201)
def log_call(payload: CallLogIn, ctx: Ctx) -> CallLogOut:
    call, follow_up = calls.log_call(ctx.db, ctx.workspace_id, payload)
    return CallLogOut.model_validate({"call": call, "follow_up": follow_up})


@router.get("/calls/stats", response_model=CallStatsOut)
def stats(ctx: Ctx) -> CallStatsOut:
    return calls.call_stats(ctx.db, ctx.workspace_id)


@router.get("/reminders", response_model=list[ActivityOut])
def reminders(ctx: Ctx) -> list[ActivityOut]:
    return [ActivityOut.model_validate(a) for a in calls.pending_reminders(ctx.db, ctx.workspace_id)]
