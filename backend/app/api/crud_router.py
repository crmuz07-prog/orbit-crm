"""One router implementation for every CRM entity; each entity only declares an EntitySpec.

Note: no `from __future__ import annotations` here — FastAPI must see the real schema classes
used in the dynamically built endpoint signatures.
"""

from dataclasses import dataclass, field
from typing import Any

from fastapi import APIRouter, Response, status
from pydantic import BaseModel
from sqlalchemy import ColumnElement

from app.api.deps import Ctx, RequestContext
from app.models.base import OwnedMixin, TenantMixin
from app.services import crud
from app.services.export import member_names, to_csv
from app.services.permissions import Action, Module
from app.services.visibility import Visibility, ensure_assignable, ensure_visible
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
    # Owned sales records are guarded by module permissions and scope...
    module: Module | None = None
    # ...workspace configuration (pipeline stages) by a minimum role for writes instead.
    write_role: str = "member"


class Guard:
    """Applies an EntitySpec's access rules to one request."""

    def __init__(self, spec: EntitySpec, ctx: RequestContext) -> None:
        self.spec, self.ctx = spec, ctx

    def allow(self, action: Action) -> Visibility | None:
        """Checks the action and returns the caller's scope (None for unscoped configuration entities)."""
        if self.spec.module is None:
            if action != "view":
                require_role(self.ctx.membership, self.spec.write_role)
            return None
        self.ctx.access.require(self.spec.module, action)
        return self.ctx.visibility(self.spec.module)

    def rows(self, action: Action) -> Any:
        visibility = self.allow(action)
        visible = visibility.where(self.owned) if visibility else None
        return crud.list_rows(self.ctx.db, self.spec.model, self.ctx.workspace_id, self.spec.order_by, visible)

    def row(self, row_id: str, action: Action) -> tuple[Any, Visibility | None]:
        visibility = self.allow(action)
        row = crud.get_row(self.ctx.db, self.spec.model, self.ctx.workspace_id, row_id)
        if visibility:
            ensure_visible(row, visibility)
        return row, visibility

    def check_owner(self, values: dict[str, Any], visibility: Visibility | None) -> None:
        if visibility and "owner_id" in values:
            ensure_assignable(self.ctx.db, self.ctx.workspace_id, values["owner_id"], visibility)

    @property
    def owned(self) -> type[OwnedMixin]:
        return self.spec.model  # type: ignore[return-value]


def build_crud_router(spec: EntitySpec) -> APIRouter:
    router = APIRouter(prefix=f"/{spec.path}", tags=[spec.path])
    Create, Patch, Read = spec.create, spec.patch, spec.read

    @router.get("", response_model=list[Read])
    def list_rows(ctx: Ctx) -> Any:
        return Guard(spec, ctx).rows("view")

    @router.get("/export", response_class=Response)
    def export_rows(ctx: Ctx) -> Response:
        rows = Guard(spec, ctx).rows("export")
        headers = {"Content-Disposition": f'attachment; filename="{spec.path}.csv"'}
        csv = to_csv(rows, Read, member_names(ctx.db, ctx.workspace_id))
        return Response(csv, media_type="text/csv; charset=utf-8", headers=headers)

    @router.get("/{row_id}", response_model=Read)
    def get_row(row_id: str, ctx: Ctx) -> Any:
        return Guard(spec, ctx).row(row_id, "view")[0]

    @router.post("", response_model=Read, status_code=status.HTTP_201_CREATED)
    def create_row(payload: Create, ctx: Ctx) -> Any:  # type: ignore[valid-type]
        guard = Guard(spec, ctx)
        visibility = guard.allow("create")
        values = payload.model_dump()
        # New records belong to their creator unless an owner is chosen explicitly.
        if spec.module and "owner_id" not in payload.model_fields_set:
            values["owner_id"] = ctx.user.id
        guard.check_owner(values, visibility)
        return crud.create_row(ctx.db, spec.model, ctx.workspace_id, values, spec.references, spec.before_save)

    @router.patch("/{row_id}", response_model=Read)
    def update_row(row_id: str, payload: Patch, ctx: Ctx) -> Any:  # type: ignore[valid-type]
        guard = Guard(spec, ctx)
        row, visibility = guard.row(row_id, "edit")
        changes = payload.model_dump(exclude_unset=True)
        guard.check_owner(changes, visibility)
        return crud.update_row(ctx.db, row, changes, spec.references, spec.before_save)

    @router.delete("/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_row(row_id: str, ctx: Ctx) -> None:
        row, _ = Guard(spec, ctx).row(row_id, "delete")
        crud.delete_row(ctx.db, row, spec.before_delete)

    return router
