import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Header, Request
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.api.deps import DB, Ctx
from app.core.errors import DomainError, Unauthorized
from app.core.security import decode_access_token
from app.models import TelephonyIntegration, User
from app.schemas.crm import ActivityOut
from app.schemas.telephony import SimulateIn, TelephonyEventIn, TelephonySettingsOut, TelephonySettingsPatch
from app.services import telephony
from app.services.auth import primary_workspace
from app.services.events import broker

router = APIRouter(prefix="/telephony", tags=["telephony"])


def settings_out(integration: TelephonyIntegration) -> TelephonySettingsOut:
    return TelephonySettingsOut(
        webhook_path=f"/api/telephony/webhook/{integration.webhook_token}", signing_secret=integration.signing_secret,
        create_unknown_contacts=integration.create_unknown_contacts, callback_task_on_missed=integration.callback_task_on_missed,
    )


@router.get("", response_model=TelephonySettingsOut)
def get_settings(ctx: Ctx) -> TelephonySettingsOut:
    return settings_out(telephony.integration_for(ctx.db, ctx.workspace_id))


@router.patch("", response_model=TelephonySettingsOut)
def update_settings(payload: TelephonySettingsPatch, ctx: Ctx) -> TelephonySettingsOut:
    integration = telephony.integration_for(ctx.db, ctx.workspace_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(integration, field, value)
    ctx.db.commit()
    return settings_out(integration)


@router.post("/rotate", response_model=TelephonySettingsOut)
def rotate(ctx: Ctx) -> TelephonySettingsOut:
    return settings_out(telephony.rotate(ctx.db, telephony.integration_for(ctx.db, ctx.workspace_id)))


@router.post("/webhook/{token}")
async def webhook(token: str, request: Request, db: DB, x_orbit_signature: str | None = Header(default=None)) -> dict[str, Any]:
    """Endpoint the PBX calls. Body: TelephonyEventIn JSON, header `X-Orbit-Signature: sha256=<hmac>`."""
    body = await request.body()
    integration = await run_in_threadpool(telephony.integration_by_token, db, token)
    telephony.verify_signature(integration.signing_secret, body, x_orbit_signature)
    try:
        event = TelephonyEventIn.model_validate(json.loads(body))
    except (ValueError, ValidationError) as exc:
        raise DomainError("Invalid event payload", "invalid_payload") from exc
    call = await run_in_threadpool(telephony.ingest, db, integration, event)
    return {"ok": True, "activity_id": call.id}


@router.post("/simulate")
def simulate(payload: SimulateIn, ctx: Ctx) -> dict[str, Any]:
    """Runs the real pipeline without a PBX — for demos and testing the integration."""
    integration = telephony.integration_for(ctx.db, ctx.workspace_id)
    call_id = payload.call_id or f"sim-{uuid.uuid4()}"
    ours, theirs = "+998712000000", payload.phone
    base = {"call_id": call_id, "direction": payload.direction, "from": theirs if payload.direction == "inbound" else ours,
            "to": ours if payload.direction == "inbound" else theirs}
    events = (["call.ringing"] + (["call.answered"] if payload.status == "answered" else [])) if payload.action == "start" else ["call.ended"]
    call = None
    for name in events:
        event = TelephonyEventIn.model_validate({**base, "event": name, "status": payload.status if name == "call.ended" else None, "duration": payload.duration})
        call = telephony.ingest(ctx.db, integration, event)
    return {"call_id": call_id, "activity": ActivityOut.model_validate(call)}


def _workspace_for_token(db: DB, token: str) -> str:
    user_id = decode_access_token(token)
    if not user_id or db.get(User, user_id) is None:
        raise Unauthorized("Not authenticated", "not_authenticated")
    return primary_workspace(db, user_id).id


@router.get("/stream")
async def stream(token: str, request: Request, db: DB) -> StreamingResponse:
    """Server-Sent Events; EventSource cannot send headers, so the JWT comes in the query string."""
    workspace_id = await run_in_threadpool(_workspace_for_token, db, token)

    async def events() -> AsyncIterator[str]:
        yield ": connected\n\n"
        async for event in broker.subscribe(workspace_id):
            if await request.is_disconnected():
                break
            yield ": ping\n\n" if event is None else f"event: call\ndata: {json.dumps(event)}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
