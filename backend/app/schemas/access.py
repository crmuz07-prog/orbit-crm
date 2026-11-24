from typing import Any

from pydantic import Field

from app.schemas.base import Schema

RoleName = Field(min_length=1, max_length=80)


class AccessRoleOut(Schema):
    id: str
    name: str
    permissions: dict[str, dict[str, Any]]
    is_default: bool
    member_count: int


class AccessRoleIn(Schema):
    name: str = RoleName
    permissions: dict[str, dict[str, Any]] = {}


class AccessRolePatch(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    permissions: dict[str, dict[str, Any]] | None = None
    # Only `true` is meaningful: making another role the default unsets the previous one.
    is_default: bool | None = None


class SalesTeamOut(Schema):
    id: str
    name: str
    member_count: int


class SalesTeamIn(Schema):
    name: str = RoleName


class AccessOut(Schema):
    roles: list[AccessRoleOut]
    teams: list[SalesTeamOut]
