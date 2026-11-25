from fastapi import APIRouter, Depends, Request

from app.api.deps import DB, UserCtx
from app.core.client_ip import client_ip
from app.core.config import get_settings
from app.core.rate_limit import rate_limit
from app.schemas.auth import AuthConfigOut, LoginIn, RegisterIn, SessionOut, SwitchIn, TokenOut, WorkspaceChoice
from app.services import auth

router = APIRouter(prefix="/auth", tags=["auth"])

# Per IP, on top of the per-account lockout: slows password spraying across many accounts and sign-up abuse.
SIGN_IN = Depends(rate_limit("sign-in", 30, 300))


@router.get("/config", response_model=AuthConfigOut)
def config() -> AuthConfigOut:
    settings = get_settings()
    return AuthConfigOut(demo_enabled=settings.demo_enabled, email_enabled=bool(settings.smtp_host), registration_enabled=settings.registration_enabled)


@router.post("/register", response_model=TokenOut, status_code=201, dependencies=[SIGN_IN])
def register(payload: RegisterIn, db: DB) -> TokenOut:
    return auth.register(db, payload)


@router.post("/login", response_model=TokenOut, dependencies=[SIGN_IN])
def login(payload: LoginIn, request: Request, db: DB) -> TokenOut:
    return auth.login(db, payload, client_ip(request))


@router.post("/demo", response_model=TokenOut, dependencies=[SIGN_IN])
def demo(db: DB) -> TokenOut:
    return auth.demo_login(db)


@router.get("/me", response_model=SessionOut)
def me(ctx: UserCtx) -> SessionOut:
    return auth.session_out(ctx.db, ctx.user, ctx.workspace_id)


@router.get("/workspaces", response_model=list[WorkspaceChoice])
def list_workspaces(ctx: UserCtx) -> list[WorkspaceChoice]:
    return auth.list_workspaces(ctx.db, ctx.user.id)


@router.post("/switch", response_model=TokenOut)
def switch(payload: SwitchIn, ctx: UserCtx) -> TokenOut:
    return auth.switch_workspace(ctx.db, ctx.user, payload.workspace_id)
