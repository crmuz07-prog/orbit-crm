from datetime import datetime
from typing import Any, TypeVar

from pydantic import BaseModel, ConfigDict, create_model

Model = TypeVar("Model", bound=BaseModel)


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class RowRead(Schema):
    id: str
    created_at: datetime
    updated_at: datetime


def partial(model: type[Model], name: str) -> type[Model]:
    """Builds a PATCH schema: same fields as `model`, all optional, no defaults applied."""
    fields: dict[str, Any] = {
        field_name: (info.annotation | None, None) for field_name, info in model.model_fields.items()
    }
    return create_model(name, __base__=Schema, **fields)  # type: ignore[return-value]
