from fastapi import APIRouter

from app.api.deps import DB, UserCtx
from app.core.config import get_settings
from app.schemas.auth import AuthConfigOut, LoginIn, RegisterIn, SessionOut, SwitchIn, TokenOut, UserOut, WorkspaceChoice, WorkspaceOut
from app.services import auth, workspaces

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config", response_model=AuthConfigOut)
def config() -> AuthConfigOut:
    settings = get_settings()
    return AuthConfigOut(demo_enabled=settings.demo_enabled, email_enabled=bool(settings.smtp_host), registration_enabled=settings.registration_enabled)


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: DB) -> TokenOut:
    return auth.register(db, payload)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: DB) -> TokenOut:
    return auth.login(db, payload)


@router.post("/demo", response_model=TokenOut)
def demo(db: DB) -> TokenOut:
    return auth.demo_login(db)


@router.get("/me", response_model=SessionOut)
def me(ctx: UserCtx) -> SessionOut:
    found = workspaces.resolve_optional(ctx.db, ctx.user.id, ctx.workspace_id)
    if found is None and not ctx.user.is_superadmin:
        workspaces.resolve(ctx.db, ctx.user.id)  # raises no_workspace
    membership, workspace = found if found else (None, None)
    return SessionOut(user=UserOut.model_validate(ctx.user), workspace=WorkspaceOut.model_validate(workspace) if workspace else None,
                      role=membership.role if membership else None)  # type: ignore[arg-type]


@router.get("/workspaces", response_model=list[WorkspaceChoice])
def list_workspaces(ctx: UserCtx) -> list[WorkspaceChoice]:
    return auth.list_workspaces(ctx.db, ctx.user.id)


@router.post("/switch", response_model=TokenOut)
def switch(payload: SwitchIn, ctx: UserCtx) -> TokenOut:
    return auth.switch_workspace(ctx.db, ctx.user, payload.workspace_id)
