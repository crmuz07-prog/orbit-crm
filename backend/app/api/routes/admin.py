from fastapi import APIRouter, status

from app.api.deps import SuperCtx
from app.schemas.admin import AdminUserIn, AdminUserOut, AdminUserPatch, CompanyIn, CompanyOut, CompanyPatch, MembershipIn
from app.schemas.team import SetPasswordIn
from app.services import admin

router = APIRouter(prefix="/admin", tags=["superadmin"])


@router.get("/companies", response_model=list[CompanyOut])
def companies(ctx: SuperCtx) -> list[CompanyOut]:
    return admin.list_companies(ctx.db)


@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyIn, ctx: SuperCtx) -> CompanyOut:
    return admin.create_company(ctx.db, payload)


@router.patch("/companies/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def rename_company(workspace_id: str, payload: CompanyPatch, ctx: SuperCtx) -> None:
    admin.rename_company(ctx.db, workspace_id, payload.name)


@router.get("/users", response_model=list[AdminUserOut])
def users(ctx: SuperCtx) -> list[AdminUserOut]:
    return admin.list_users(ctx.db)


@router.post("/users", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: AdminUserIn, ctx: SuperCtx) -> AdminUserOut:
    return admin.create_account(ctx.db, payload)


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(user_id: str, payload: AdminUserPatch, ctx: SuperCtx) -> AdminUserOut:
    return admin.update_account(ctx.db, ctx.user, user_id, payload.full_name, payload.is_active, payload.is_superadmin)


@router.post("/users/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def set_password(user_id: str, payload: SetPasswordIn, ctx: SuperCtx) -> None:
    admin.set_password(ctx.db, user_id, payload.password)


@router.post("/users/{user_id}/memberships", response_model=AdminUserOut)
def add_membership(user_id: str, payload: MembershipIn, ctx: SuperCtx) -> AdminUserOut:
    return admin.add_membership(ctx.db, user_id, payload.workspace_id, payload.role)


@router.delete("/users/{user_id}/memberships/{workspace_id}", response_model=AdminUserOut)
def remove_membership(user_id: str, workspace_id: str, ctx: SuperCtx) -> AdminUserOut:
    return admin.remove_membership(ctx.db, user_id, workspace_id)
