from datetime import date, datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.auth import Password, Role
from app.schemas.base import Schema

Name = Field(min_length=1, max_length=120)


CompanyStatus = Literal["active", "expired", "blocked"]


class CompanyOut(Schema):
    id: str
    name: str
    is_demo: bool
    created_at: datetime
    member_count: int
    owners: list[str]
    status: CompanyStatus
    subscription_ends_at: date | None
    days_left: int | None
    seat_limit: int | None
    seats_used: int
    license_months: int
    price_paid: float


class OwnerIn(Schema):
    full_name: str = Name
    email: EmailStr
    password: str = Password


class CompanyIn(Schema):
    name: str = Name
    owner: OwnerIn
    seat_limit: int | None = Field(default=None, ge=1)
    subscription_ends_at: date | None = None


class CompanyPatch(Schema):
    """Only the fields sent are changed; `null` clears a limit (unlimited seats / no end date)."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    status: Literal["active", "blocked"] | None = None
    seat_limit: int | None = Field(default=None, ge=1)
    subscription_ends_at: date | None = None
    license_months: int | None = Field(default=None, ge=1, le=120)


class PaymentIn(Schema):
    amount: float = Field(gt=0)
    # The term bought; defaults to the company's current term (erp1).
    months: int | None = Field(default=None, ge=1, le=120)
    seats: int | None = Field(default=None, ge=1)
    note: str | None = Field(default=None, max_length=500)


class PaymentOut(Schema):
    id: str
    workspace_id: str
    workspace_name: str
    amount: float
    months: int
    seats: int | None
    period_start: date
    period_end: date
    note: str | None
    created_at: datetime


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


class LoginAttemptOut(Schema):
    id: str
    email: str
    ip: str | None
    success: bool
    created_at: datetime
