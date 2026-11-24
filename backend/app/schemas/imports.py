from typing import Literal

from pydantic import Field

from app.schemas.base import Schema
from app.schemas.fields import FieldType

Target = Literal[
    "ignore", "external_id", "title", "contact_name", "phone", "email", "created_at", "stage", "owner", "amount", "source",
    "lost_reason", "note", "next_contact", "platform", "campaign", "adset", "ad_name", "form_name", "custom", "new_custom",
    "company", "ad_id", "form_id",
]


class ColumnMap(Schema):
    column: int = Field(ge=0)
    header: str = ""
    samples: list[str] = Field(default_factory=list)
    target: Target = "ignore"
    # target=custom: an existing field; target=new_custom: the field to create.
    field_key: str | None = None
    new_label: str | None = Field(default=None, max_length=80)
    new_type: FieldType | None = None


class ImportFile(Schema):
    filename: str = Field(min_length=1, max_length=200)
    # The file as base64: keeps the API JSON-only (no multipart dependency); 5 MB is plenty for a lead sheet.
    content: str = Field(min_length=1, max_length=7_000_000)


class ImportPreview(Schema):
    rows: int
    columns: list[ColumnMap]


class ImportRequest(ImportFile):
    pipeline_id: str
    columns: list[ColumnMap]
    # No company column: every contact gets a company of its own, named after the person (same names stay separate).
    company_per_contact: bool = False


class ImportResult(Schema):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    stages_created: list[str] = Field(default_factory=list)
    fields_created: list[str] = Field(default_factory=list)
    unmatched_owners: list[str] = Field(default_factory=list)
    tasks_created: int = 0
    companies_created: int = 0
