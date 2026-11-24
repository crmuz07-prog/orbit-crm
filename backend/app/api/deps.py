from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import Forbidden, Unauthorized
from app.core.security import decode_access_token
from app.models import Membership, User, Workspace
from app.services import billing, permissions, visibility, workspaces
from app.services.permissions import Access, Module
from app.services.visibility import Visibility

bearer = HTTPBearer(auto_error=False)

DB = Annotated[Session, Depends(get_db)]
Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]


@dataclass(frozen=True)
class RequestContext:
    """Who is calling, their role, and which workspace every query must be scoped to."""

    db: Session
    user: User
    workspace: Workspace
    membership: Membership
    access: Access

    @property
    def workspace_id(self) -> str:
        return self.workspace.id

    @property
    def role(self) -> str:
        return self.membership.role

    def visibility(self, module: Module) -> Visibility:
        return visibility.for_module(self.db, self.access, self.membership, module)


@dataclass(frozen=True)
class UserContext:
    """An authenticated user who may not be inside any workspace (e.g. a superadmin)."""

    db: Session
    user: User
    workspace_id: str | None


def user_for_token(db: Session, token: str | None) -> UserContext:
    claims = decode_access_token(token) if token else None
    user = db.get(User, claims.user_id) if claims else None
    if claims is None or user is None:
        raise Unauthorized("Not authenticated", "not_authenticated")
    # Deactivation takes effect immediately, even for tokens issued earlier.
    if not user.is_active:
        raise Unauthorized("This account has been deactivated", "account_disabled")
    if claims.session_version != user.session_version:
        raise Unauthorized("This session was signed out", "session_revoked")
    return UserContext(db=db, user=user, workspace_id=claims.workspace_id)


def context_for_token(db: Session, token: str | None) -> RequestContext:
    base = user_for_token(db, token)
    # The token's workspace is honoured only while the membership still exists.
    membership, workspace = workspaces.resolve(db, base.user.id, base.workspace_id)
    # Lazy subscription enforcement (erp1): an expired or blocked company is closed; the operator still gets in.
    if not base.user.is_superadmin:
        billing.ensure_open(workspace)
    access = permissions.resolve(db, membership)
    return RequestContext(db=db, user=base.user, workspace=workspace, membership=membership, access=access)


def get_context(db: DB, credentials: Credentials) -> RequestContext:
    return context_for_token(db, credentials.credentials if credentials else None)


def get_user_context(db: DB, credentials: Credentials) -> UserContext:
    return user_for_token(db, credentials.credentials if credentials else None)


def require_admin(ctx: Annotated[RequestContext, Depends(get_context)]) -> RequestContext:
    workspaces.require_role(ctx.membership, "admin")
    workspaces.require_editable(ctx.workspace)
    return ctx


def require_superadmin(ctx: Annotated[UserContext, Depends(get_user_context)]) -> UserContext:
    if not ctx.user.is_superadmin:
        raise Forbidden("Superadmin only", "forbidden")
    return ctx


Ctx = Annotated[RequestContext, Depends(get_context)]
AdminCtx = Annotated[RequestContext, Depends(require_admin)]
UserCtx = Annotated[UserContext, Depends(get_user_context)]
SuperCtx = Annotated[UserContext, Depends(require_superadmin)]
