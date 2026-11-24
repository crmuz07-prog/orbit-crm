from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.auth import Password, Role
from app.schemas.base import Schema

Name = Field(min_length=1, max_length=120)


class CompanyOut(Schema):
    id: str
    name: str
    is_demo: bool
    created_at: datetime
    member_count: int
    owners: list[str]


class OwnerIn(Schema):
    full_name: str = Name
    email: EmailStr
    password: str = Password


class CompanyIn(Schema):
    name: str = Name
    owner: OwnerIn


class CompanyPatch(Schema):
    name: str = Name


class MembershipOut(Schema):
    workspace_id: str
    workspace_name: str
    role: Role


class AdminUserOut(Schema):
    id: str
    full_name: str
    email: str
    is_active: bool
    is_superadmin: bool
    must_change_password: bool
    created_at: datetime
    memberships: list[MembershipOut]


class AdminUserIn(Schema):
    full_name: str = Name
    email: EmailStr
    password: str = Password
    workspace_id: str | None = None
    role: Role = "member"


class AdminUserPatch(Schema):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None
    is_superadmin: bool | None = None


class MembershipIn(Schema):
    workspace_id: str
    role: Role = "member"
