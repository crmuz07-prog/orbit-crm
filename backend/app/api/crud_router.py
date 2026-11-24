"""One router implementation for every CRM entity; each entity only declares an EntitySpec.

Note: no `from __future__ import annotations` here — FastAPI must see the real schema classes
used in the dynamically built endpoint signatures.
"""

from dataclasses import dataclass, field
from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel
from sqlalchemy import ColumnElement

from app.api.deps import Ctx
from app.models.base import TenantMixin
from app.services import crud
from app.services.workspaces import require_role


@dataclass(frozen=True)
class EntitySpec:
    path: str
    model: type[TenantMixin]
    create: type[BaseModel]
    patch: type[BaseModel]
    read: type[BaseModel]
    order_by: ColumnElement[Any]
    references: dict[str, type[TenantMixin]] = field(default_factory=dict)
    before_save: crud.SaveHook | None = None
    before_delete: crud.DeleteHook | None = None
    # Minimum role for create/update/delete (reads are open to every member).
    write_role: str = "member"


def build_crud_router(spec: EntitySpec) -> APIRouter:
    router = APIRouter(prefix=f"/{spec.path}", tags=[spec.path])
    Create, Patch, Read = spec.create, spec.patch, spec.read

    @router.get("", response_model=list[Read])
    def list_rows(ctx: Ctx) -> Any:
        return crud.list_rows(ctx.db, spec.model, ctx.workspace_id, spec.order_by)

    @router.get("/{row_id}", response_model=Read)
    def get_row(row_id: str, ctx: Ctx) -> Any:
        return crud.get_row(ctx.db, spec.model, ctx.workspace_id, row_id)

    @router.post("", response_model=Read, status_code=status.HTTP_201_CREATED)
    def create_row(payload: Create, ctx: Ctx) -> Any:  # type: ignore[valid-type]
        require_role(ctx.membership, spec.write_role)
        values = payload.model_dump()
        return crud.create_row(ctx.db, spec.model, ctx.workspace_id, values, spec.references, spec.before_save)

    @router.patch("/{row_id}", response_model=Read)
    def update_row(row_id: str, payload: Patch, ctx: Ctx) -> Any:  # type: ignore[valid-type]
        require_role(ctx.membership, spec.write_role)
        row = crud.get_row(ctx.db, spec.model, ctx.workspace_id, row_id)
        changes = payload.model_dump(exclude_unset=True)
        return crud.update_row(ctx.db, row, changes, spec.references, spec.before_save)

    @router.delete("/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_row(row_id: str, ctx: Ctx) -> None:
        require_role(ctx.membership, spec.write_role)
        row = crud.get_row(ctx.db, spec.model, ctx.workspace_id, row_id)
        crud.delete_row(ctx.db, row, spec.before_delete)

    return router
