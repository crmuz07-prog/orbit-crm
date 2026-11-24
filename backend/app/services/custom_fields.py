"""Workspace-defined deal fields: keys, value cleaning and the list options that grow on import."""

import re
import unicodedata
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CustomField, Deal


def slug(label: str) -> str:
    ascii_label = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", ascii_label.lower()).strip("_")[:50] or "field"


def fields_for(db: Session, workspace_id: str) -> list[CustomField]:
    query = select(CustomField).where(CustomField.workspace_id == workspace_id, CustomField.entity == "deal")
    return list(db.scalars(query.order_by(CustomField.position, CustomField.created_at)))


def assign_key(db: Session, field: CustomField, changed: set[str]) -> None:
    """A stable key from the label on creation; renaming the label later never moves stored values."""
    if field.key:
        return
    taken = {f.key for f in fields_for(db, field.workspace_id)}
    base = key = slug(field.label)
    n = 2
    while key in taken:
        key, n = f"{base}_{n}", n + 1
    field.key = key


def clean_value(field: CustomField, value: Any) -> Any:
    """Normalises one value to the field's type; None means "not set"."""
    if value is None or value == "" or value == []:
        return None
    if field.type == "number":
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    if field.type == "multiselect":
        items = value if isinstance(value, list) else str(value).split(",")
        return [str(v).strip() for v in items if str(v).strip()] or None
    return str(value).strip() or None


def clean_custom(db: Session, deal: Deal) -> None:
    """Keeps only values of fields that exist, typed correctly."""
    fields = {f.key: f for f in fields_for(db, deal.workspace_id)}
    cleaned = {k: clean_value(fields[k], v) for k, v in (deal.custom or {}).items() if k in fields}
    deal.custom = {k: v for k, v in cleaned.items() if v is not None}


def add_options(field: CustomField, values: list[str]) -> None:
    """Unknown list values (from an import) become options instead of being lost."""
    missing = [v for v in values if v not in field.options]
    if missing:
        field.options = [*field.options, *missing]
