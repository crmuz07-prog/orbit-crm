from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import Unauthorized
from app.core.security import decode_access_token
from app.models import User, Workspace
from app.services.auth import primary_workspace

bearer = HTTPBearer(auto_error=False)

DB = Annotated[Session, Depends(get_db)]


@dataclass(frozen=True)
class RequestContext:
    """Who is calling and which workspace every query must be scoped to."""

    db: Session
    user: User
    workspace: Workspace

    @property
    def workspace_id(self) -> str:
        return self.workspace.id


def get_context(db: DB, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> RequestContext:
    user_id = decode_access_token(credentials.credentials) if credentials else None
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise Unauthorized("Not authenticated", "not_authenticated")
    return RequestContext(db=db, user=user, workspace=primary_workspace(db, user.id))


Ctx = Annotated[RequestContext, Depends(get_context)]
