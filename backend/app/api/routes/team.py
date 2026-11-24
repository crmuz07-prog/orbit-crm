from fastapi import APIRouter, status

from app.api.deps import AdminCtx, Ctx
from app.models import Membership, User
from app.schemas.team import MemberOut, NewMemberIn, NewMemberOut, RoleIn, SetPasswordIn, TeamOut
from app.services import team
from app.services.workspaces import ROLE_RANK

router = APIRouter(prefix="/team", tags=["team"])


def member_out(membership: Membership, user: User) -> MemberOut:
    return MemberOut(user_id=user.id, full_name=user.full_name, email=user.email, role=membership.role,  # type: ignore[arg-type]
                     is_active=user.is_active, must_change_password=user.must_change_password, joined_at=membership.created_at)


@router.get("", response_model=TeamOut)
def get_team(ctx: Ctx) -> TeamOut:
    can_manage = ROLE_RANK[ctx.role] >= ROLE_RANK["admin"] and not ctx.workspace.is_demo
    return TeamOut(members=[member_out(m, u) for m, u in team.members(ctx.db, ctx.workspace_id)], can_manage=can_manage)


@router.post("/members", response_model=NewMemberOut, status_code=status.HTTP_201_CREATED)
def add_member(payload: NewMemberIn, ctx: AdminCtx) -> NewMemberOut:
    membership, user, created = team.add_member(ctx.db, ctx.membership, ctx.workspace, payload.full_name, payload.email, payload.role, payload.password)
    return NewMemberOut(**member_out(membership, user).model_dump(), account_created=created)


@router.patch("/members/{user_id}", response_model=MemberOut)
def change_role(user_id: str, payload: RoleIn, ctx: AdminCtx) -> MemberOut:
    membership = team.change_role(ctx.db, ctx.membership, user_id, payload.role)
    return member_out(membership, ctx.db.get(User, user_id))  # type: ignore[arg-type]


@router.delete("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(user_id: str, ctx: AdminCtx) -> None:
    team.remove(ctx.db, ctx.membership, user_id)


@router.post("/members/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def set_member_password(user_id: str, payload: SetPasswordIn, ctx: AdminCtx) -> None:
    """ERP-style: the admin issues a temporary password; the person must change it at the next sign-in."""
    team.set_member_password(ctx.db, ctx.membership, user_id, payload.password)
