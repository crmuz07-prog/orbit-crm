import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import access, account, admin, auth, calls, entities, team, telephony, workspace
from app.core.config import get_settings
from app.core.db import SessionLocal, engine
from app.core.errors import DomainError
from app.core.migrate import migrate
from app.services.admin import ensure_superadmin
from app.services.events import broker

# App loggers (e.g. links logged when SMTP is not configured) must reach the platform logs.
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def bootstrap_superadmin() -> None:
    settings = get_settings()
    if settings.superadmin_email and settings.superadmin_password:
        with SessionLocal() as db:
            ensure_superadmin(db, settings.superadmin_email, settings.superadmin_password)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    migrate(engine)
    bootstrap_superadmin()
    broker.bind(asyncio.get_running_loop())
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Orbit CRM API", version="2.0.0", lifespan=lifespan)
    settings = get_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainError)
    async def domain_error(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "code": exc.code})

    @app.get("/api/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    for module in (auth, account, team, access, admin, calls, entities, telephony, workspace):
        app.include_router(module.router, prefix="/api")
    return app


app = create_app()
