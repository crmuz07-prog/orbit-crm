from fastapi import APIRouter, status

from app.api.deps import Ctx
from app.core.errors import Forbidden
from app.schemas.dashboard import DashboardOut
from app.services.metrics import build_dashboard
from app.services.seed import seed_workspace, wipe_workspace

router = APIRouter(tags=["workspace"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(ctx: Ctx) -> DashboardOut:
    return build_dashboard(ctx.db, ctx.workspace_id)


@router.post("/workspace/seed", status_code=status.HTTP_204_NO_CONTENT)
def seed(ctx: Ctx) -> None:
    seed_workspace(ctx.db, ctx.workspace_id)


@router.post("/workspace/reset", status_code=status.HTTP_204_NO_CONTENT)
def reset(ctx: Ctx) -> None:
    if not ctx.workspace.is_demo:
        raise Forbidden("Only demo workspaces can be reset", "reset_demo_only")
    wipe_workspace(ctx.db, ctx.workspace_id)
    seed_workspace(ctx.db, ctx.workspace_id)
