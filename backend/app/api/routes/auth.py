from fastapi import APIRouter

from app.api.deps import DB, Ctx
from app.schemas.auth import LoginIn, RegisterIn, SessionOut, TokenOut
from app.services import auth

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: DB) -> TokenOut:
    return auth.register(db, payload)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: DB) -> TokenOut:
    return auth.login(db, payload)


@router.post("/demo", response_model=TokenOut)
def demo(db: DB) -> TokenOut:
    return auth.demo_login(db)


@router.get("/me", response_model=SessionOut)
def me(ctx: Ctx) -> SessionOut:
    return SessionOut.model_validate({"user": ctx.user, "workspace": ctx.workspace})
