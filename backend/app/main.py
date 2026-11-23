import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, calls, entities, telephony, workspace
from app.core.config import get_settings
from app.core.db import Base, engine
from app.core.errors import DomainError
from app.services.events import broker


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Schema is created on boot for zero-setup local dev; use migrations for production.
    Base.metadata.create_all(engine)
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

    for module in (auth, calls, entities, telephony, workspace):
        app.include_router(module.router, prefix="/api")
    return app


app = create_app()
