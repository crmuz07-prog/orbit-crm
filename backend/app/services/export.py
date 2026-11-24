"""CSV export of a list exactly as the caller is allowed to see it."""

import csv
import io
from collections.abc import Iterable, Mapping
from typing import Any

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Membership, User


def member_names(db: Session, workspace_id: str) -> dict[str, str]:
    query = select(User.id, User.full_name).join(Membership, Membership.user_id == User.id).where(Membership.workspace_id == workspace_id)
    return {user_id: name for user_id, name in db.execute(query).all()}


def to_csv(rows: Iterable[Any], schema: type[BaseModel], owners: Mapping[str, str]) -> str:
    """Owner ids become names, which is what a spreadsheet reader needs."""
    columns = list(schema.model_fields)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["owner" if c == "owner_id" else c for c in columns])
    for row in rows:
        data = schema.model_validate(row).model_dump(mode="json")
        if data.get("owner_id"):
            data["owner_id"] = owners.get(data["owner_id"], "")
        writer.writerow(["" if data[c] is None else data[c] for c in columns])
    # A BOM makes Excel open UTF-8 (Cyrillic and Uzbek names) correctly.
    return "﻿" + buffer.getvalue()
