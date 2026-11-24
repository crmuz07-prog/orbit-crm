from fastapi import APIRouter, status

from app.api.deps import AdminCtx, Ctx
from app.schemas.access import AccessOut, AccessRoleIn, AccessRolePatch, SalesTeamIn
from app.services import access
from app.services.workspaces import require_role

router = APIRouter(prefix="/access", tags=["access"])


@router.get("", response_model=AccessOut)
def overview(ctx: Ctx) -> AccessOut:
    # Readable in the demo too (AdminCtx would refuse it as read-only).
    require_role(ctx.membership, "admin")
    return access.overview(ctx.db, ctx.workspace_id)


@router.post("/roles", status_code=status.HTTP_204_NO_CONTENT)
def create_role(payload: AccessRoleIn, ctx: AdminCtx) -> None:
    access.create_role(ctx.db, ctx.workspace_id, payload.name, payload.permissions)


@router.patch("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_role(role_id: str, payload: AccessRolePatch, ctx: AdminCtx) -> None:
    access.update_role(ctx.db, ctx.workspace_id, role_id, payload.name, payload.permissions, payload.is_default)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: str, ctx: AdminCtx) -> None:
    access.delete_role(ctx.db, ctx.workspace_id, role_id)


@router.post("/teams", status_code=status.HTTP_204_NO_CONTENT)
def create_team(payload: SalesTeamIn, ctx: AdminCtx) -> None:
    access.create_team(ctx.db, ctx.workspace_id, payload.name)


@router.patch("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def rename_team(team_id: str, payload: SalesTeamIn, ctx: AdminCtx) -> None:
    access.rename_team(ctx.db, ctx.workspace_id, team_id, payload.name)


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: str, ctx: AdminCtx) -> None:
    access.delete_team(ctx.db, ctx.workspace_id, team_id)
