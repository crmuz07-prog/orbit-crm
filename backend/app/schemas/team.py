from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.auth import Password, Role
from app.schemas.base import Schema


class MemberOut(Schema):
    user_id: str
    full_name: str
    email: str
    role: Role
    is_active: bool
    must_change_password: bool
    joined_at: datetime


class NewMemberOut(MemberOut):
    # False when an existing account was added: the temporary password was not applied.
    account_created: bool


class TeamOut(Schema):
    members: list[MemberOut]
    can_manage: bool


class NewMemberIn(Schema):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    role: Role = "member"
    # Temporary: the person must replace it after the first sign-in (ignored for existing accounts).
    password: str = Password


class RoleIn(Schema):
    role: Role


class SetPasswordIn(Schema):
    password: str = Password
