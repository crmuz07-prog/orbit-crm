from fastapi import APIRouter, status

from app.api.deps import DB, UserCtx
from app.schemas.auth import ForgotIn, PasswordChangeIn, ProfileIn, ResetIn, TokenIn, TokenOut, UserOut
from app.services import account, auth

router = APIRouter(prefix="/auth", tags=["account"])


@router.post("/forgot", status_code=status.HTTP_204_NO_CONTENT)
def forgot(payload: ForgotIn, db: DB) -> None:
    account.request_password_reset(db, payload.email)


@router.post("/reset", response_model=TokenOut)
def reset(payload: ResetIn, db: DB) -> TokenOut:
    """Sets the new password and signs the user in."""
    return auth.issue_token(db, account.reset_password(db, payload.token, payload.password))


@router.post("/verify", response_model=UserOut)
def verify(payload: TokenIn, db: DB) -> UserOut:
    return UserOut.model_validate(account.verify_email(db, payload.token))


@router.post("/verify/resend", status_code=status.HTTP_204_NO_CONTENT)
def resend_verification(ctx: UserCtx) -> None:
    account.send_verification(ctx.db, ctx.user)


@router.patch("/me", response_model=UserOut)
def update_profile(payload: ProfileIn, ctx: UserCtx) -> UserOut:
    return UserOut.model_validate(account.update_profile(ctx.db, ctx.user, payload.full_name))


@router.post("/password", response_model=TokenOut)
def change_password(payload: PasswordChangeIn, ctx: UserCtx) -> TokenOut:
    """Other devices are signed out; this one continues with the returned token."""
    account.change_password(ctx.db, ctx.user, payload.current_password, payload.new_password)
    return auth.issue_token(ctx.db, ctx.user, ctx.workspace_id)
