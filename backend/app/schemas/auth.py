from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.base import Schema

Role = Literal["owner", "admin", "member"]
Password = Field(min_length=8, max_length=128)


class RegisterIn(Schema):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Password


class LoginIn(Schema):
    email: EmailStr
    password: str


class UserOut(Schema):
    id: str
    email: str
    full_name: str
    email_verified: bool = False
    has_password: bool = True
    is_superadmin: bool = False
    must_change_password: bool = False


class WorkspaceOut(Schema):
    id: str
    name: str
    is_demo: bool


class SessionOut(Schema):
    user: UserOut
    # Empty for a superadmin who does not belong to any company.
    workspace: WorkspaceOut | None
    role: Role | None
    # Effective module permissions in the active workspace (the UI mirrors them; the API enforces them).
    permissions: dict[str, dict[str, bool | str]] | None = None


class TokenOut(SessionOut):
    access_token: str
    token_type: str = "bearer"


class WorkspaceChoice(WorkspaceOut):
    role: Role


class SwitchIn(Schema):
    workspace_id: str


class AuthConfigOut(Schema):
    demo_enabled: bool
    email_enabled: bool
    registration_enabled: bool


class ForgotIn(Schema):
    email: EmailStr


class ResetIn(Schema):
    token: str = Field(min_length=10, max_length=200)
    password: str = Password


class TokenIn(Schema):
    token: str = Field(min_length=10, max_length=200)


class ProfileIn(Schema):
    full_name: str = Field(min_length=1, max_length=120)


class PasswordChangeIn(Schema):
    current_password: str | None = None
    new_password: str = Password
