"""Instagram channel: settings, Meta webhook (handshake + deliveries), simulator, replies and analytics."""

import json
from typing import Any

from fastapi import APIRouter, Header, Query, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import PlainTextResponse

from app.api.deps import DB, AdminCtx, Ctx
from app.core.errors import DomainError, Forbidden
from app.models import Contact, InstagramIntegration, Stage
from app.schemas.crm import ActivityOut
from app.schemas.instagram import InstagramSettingsOut, InstagramSettingsPatch, InstagramStats, ReplyIn, SimulateIn
from app.services import crud, instagram, instagram_stats
from app.services.visibility import ensure_visible, workspace_user_ids
from app.services.workspaces import require_role

router = APIRouter(prefix="/instagram", tags=["instagram"])


def settings_out(i: InstagramIntegration) -> InstagramSettingsOut:
    return InstagramSettingsOut(
        webhook_path=f"/api/instagram/webhook/{i.webhook_token}", verify_token=i.verify_token, ig_account_id=i.ig_account_id,
        stage_id=i.stage_id, owner_id=i.owner_id, has_app_secret=bool(i.app_secret), has_access_token=bool(i.access_token),
        last_event_at=i.last_event_at,
    )


@router.get("", response_model=InstagramSettingsOut)
def get_settings(ctx: Ctx) -> InstagramSettingsOut:
    require_role(ctx.membership, "admin")
    return settings_out(instagram.integration_for(ctx.db, ctx.workspace_id))


@router.patch("", response_model=InstagramSettingsOut)
def update_settings(payload: InstagramSettingsPatch, ctx: AdminCtx) -> InstagramSettingsOut:
    integration = instagram.integration_for(ctx.db, ctx.workspace_id)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("stage_id"):
        crud.get_row(ctx.db, Stage, ctx.workspace_id, changes["stage_id"])
    if changes.get("owner_id") and changes["owner_id"] not in workspace_user_ids(ctx.db, ctx.workspace_id):
        raise Forbidden("The owner must be a member of this workspace", "owner_out_of_scope")
    for field, value in changes.items():
        # An empty secret clears it; otherwise only what was sent changes.
        setattr(integration, field, (value.strip() or None) if isinstance(value, str) else value)
    ctx.db.commit()
    return settings_out(integration)


@router.post("/rotate", response_model=InstagramSettingsOut)
def rotate(ctx: AdminCtx) -> InstagramSettingsOut:
    integration = instagram.integration_for(ctx.db, ctx.workspace_id)
    instagram.rotate(ctx.db, integration)
    return settings_out(integration)


@router.get("/webhook/{token}", response_class=PlainTextResponse)
def verify(token: str, db: DB, mode: str = Query(alias="hub.mode"), verify_token: str = Query(alias="hub.verify_token"),
           challenge: str = Query(alias="hub.challenge")) -> str:
    """Meta's subscription handshake: echo the challenge when the verify token matches."""
    integration = instagram.integration_by_token(db, token)
    if mode != "subscribe" or verify_token != integration.verify_token:
        raise Forbidden("Verify token does not match", "invalid_verify_token")
    return challenge


@router.post("/webhook/{token}")
async def webhook(token: str, request: Request, db: DB, x_hub_signature_256: str | None = Header(default=None)) -> dict[str, Any]:
    body = await request.body()
    integration = await run_in_threadpool(instagram.integration_by_token, db, token)
    instagram.verify_signature(integration, body, x_hub_signature_256)
    try:
        payload = json.loads(body)
    except ValueError as error:
        raise DomainError("Body is not JSON", "invalid_payload") from error
    return {"received": await run_in_threadpool(instagram.ingest, db, integration, payload)}


@router.post("/simulate")
def simulate(payload: SimulateIn, ctx: AdminCtx) -> dict[str, int]:
    integration = instagram.integration_for(ctx.db, ctx.workspace_id)
    created = instagram.simulate(ctx.db, integration, payload.kind, payload.name, payload.username, payload.text, payload.phone, payload.email, payload.ad_id)
    return {"received": created}


@router.post("/reply", response_model=ActivityOut)
def reply(payload: ReplyIn, ctx: Ctx) -> ActivityOut:
    ctx.access.require("activities", "create")
    ctx.access.require("contacts", "view")
    contact = crud.get_row(ctx.db, Contact, ctx.workspace_id, payload.contact_id)
    ensure_visible(contact, ctx.visibility("contacts"))
    activity = instagram.reply(ctx.db, instagram.integration_for(ctx.db, ctx.workspace_id), contact, payload.text, ctx.user.id)
    return ActivityOut.model_validate(activity)


@router.get("/stats", response_model=InstagramStats)
def stats(ctx: Ctx, days: int = Query(default=30, ge=1, le=365)) -> InstagramStats:
    ctx.access.require("reports", "view")
    return instagram_stats.stats(ctx.db, ctx.workspace_id, days, ctx.visibility("reports"))
