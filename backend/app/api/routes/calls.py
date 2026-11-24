from fastapi import APIRouter

from app.api.deps import Ctx
from app.models import Activity
from app.schemas.calls import CallLogIn, CallLogOut, CallStatsOut
from app.schemas.crm import ActivityOut
from app.services import calls

router = APIRouter(tags=["calls"])


@router.post("/calls", response_model=CallLogOut, status_code=201)
def log_call(payload: CallLogIn, ctx: Ctx) -> CallLogOut:
    ctx.access.require("activities", "create")
    call, follow_up = calls.log_call(ctx.db, ctx.workspace_id, ctx.user.id, payload)
    return CallLogOut.model_validate({"call": call, "follow_up": follow_up})


@router.get("/calls/stats", response_model=CallStatsOut)
def stats(ctx: Ctx) -> CallStatsOut:
    ctx.access.require("reports", "view")
    return calls.call_stats(ctx.db, ctx.workspace_id, ctx.visibility("reports").where(Activity))


@router.get("/reminders", response_model=list[ActivityOut])
def reminders(ctx: Ctx) -> list[ActivityOut]:
    ctx.access.require("activities", "view")
    return [ActivityOut.model_validate(a) for a in calls.pending_reminders(ctx.db, ctx.workspace_id, ctx.user.id)]
