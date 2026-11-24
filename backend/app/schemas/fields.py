from typing import Literal

from pydantic import Field

from app.schemas.base import RowRead, Schema, partial

FieldType = Literal["text", "number", "select", "multiselect", "date"]
# A custom value as stored in deals.custom: text, number, list choice(s) or an ISO date.
CustomValue = str | float | list[str] | None


class CustomFieldIn(Schema):
    label: str = Field(min_length=1, max_length=80)
    type: FieldType = "text"
    options: list[str] = Field(default_factory=list, max_length=200)
    warn_options: list[str] = Field(default_factory=list, max_length=200)
    position: int = 0


class CustomFieldOut(CustomFieldIn, RowRead):
    entity: str
    key: str


class LostReasonIn(Schema):
    name: str = Field(min_length=1, max_length=120)
    position: int = 0


class LostReasonOut(LostReasonIn, RowRead):
    pass


CustomFieldPatch = partial(CustomFieldIn, "CustomFieldPatch")
LostReasonPatch = partial(LostReasonIn, "LostReasonPatch")
