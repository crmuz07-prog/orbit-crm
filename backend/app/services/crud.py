"""Workspace-scoped CRUD shared by every entity. Entity-specific rules are passed in as hooks."""

from collections.abc import Callable, Mapping, Sequence
from typing import Any, TypeVar

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import Session

from app.core.errors import NotFound
from app.models.base import TenantMixin

Row = TypeVar("Row", bound=TenantMixin)
SaveHook = Callable[[Session, Any, set[str]], None]
DeleteHook = Callable[[Session, Any], None]
References = Mapping[str, type[TenantMixin]]


def list_rows(
    db: Session, model: type[Row], workspace_id: str, order_by: ColumnElement[Any], visible: ColumnElement[bool] | None = None,
) -> Sequence[Row]:
    query = select(model).where(model.workspace_id == workspace_id).order_by(order_by)
    if visible is not None:
        query = query.where(visible)
    return db.scalars(query).all()


def get_row(db: Session, model: type[Row], workspace_id: str, row_id: str) -> Row:
    row = db.get(model, row_id)
    if row is None or row.workspace_id != workspace_id:
        raise NotFound(f"{model.__name__} not found", "not_found")
    return row


def count_rows(db: Session, model: type[TenantMixin], **filters: Any) -> int:
    query = select(func.count()).select_from(model).filter_by(**filters)
    return db.scalar(query) or 0


def assert_references(db: Session, workspace_id: str, values: Mapping[str, Any], references: References) -> None:
    """Rejects links to records of another workspace (tenant isolation for foreign keys)."""
    for field, target in references.items():
        if values.get(field):
            get_row(db, target, workspace_id, values[field])


def create_row(
    db: Session,
    model: type[Row],
    workspace_id: str,
    values: dict[str, Any],
    references: References,
    before_save: SaveHook | None = None,
) -> Row:
    assert_references(db, workspace_id, values, references)
    row = model(**values, workspace_id=workspace_id)
    if before_save:
        before_save(db, row, set(values))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_row(
    db: Session,
    row: Row,
    changes: dict[str, Any],
    references: References,
    before_save: SaveHook | None = None,
) -> Row:
    assert_references(db, row.workspace_id, changes, references)
    changed = {field for field, value in changes.items() if getattr(row, field) != value}
    for field in changed:
        setattr(row, field, changes[field])
    if before_save:
        before_save(db, row, changed)
    db.commit()
    db.refresh(row)
    return row


def delete_row(db: Session, row: TenantMixin, before_delete: DeleteHook | None = None) -> None:
    if before_delete:
        before_delete(db, row)
    db.delete(row)
    db.commit()
