from pydantic import EmailStr, Field

from app.schemas.base import Schema


class RegisterIn(Schema):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(Schema):
    email: EmailStr
    password: str


class UserOut(Schema):
    id: str
    email: str
    full_name: str


class WorkspaceOut(Schema):
    id: str
    name: str
    is_demo: bool


class SessionOut(Schema):
    user: UserOut
    workspace: WorkspaceOut


class TokenOut(SessionOut):
    access_token: str
    token_type: str = "bearer"
