"""422 responses with stable, per-field codes the UI translates (instead of Pydantic's English sentences)."""

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

CODES = {
    "missing": "required",
    "string_too_short": "too_short",
    "too_short": "too_short",
    "string_too_long": "too_long",
    "too_long": "too_long",
}


def field_code(error: dict[str, Any]) -> str:
    kind = str(error.get("type", ""))
    if kind in CODES:
        return CODES[kind]
    # email-validator reports through a generic value_error.
    if kind == "value_error" and "email" in str(error.get("msg", "")).lower():
        return "email"
    return "invalid"


def field_issue(error: dict[str, Any]) -> dict[str, Any]:
    # loc is ("body", "owner", "email"): the dotted path inside the payload names the field.
    path = [str(p) for p in error.get("loc", ()) if p not in ("body", "query", "path")]
    issue: dict[str, Any] = {"field": ".".join(path), "code": field_code(error)}
    ctx = error.get("ctx") or {}
    for key in ("min_length", "max_length"):
        if key in ctx:
            issue["min" if key == "min_length" else "max"] = ctx[key]
    return issue


async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    fields = [field_issue(e) for e in exc.errors()]
    detail = "; ".join(f"{f['field'] or 'request'}: {f['code']}" for f in fields)
    return JSONResponse(status_code=422, content={"detail": detail, "code": "validation_error", "fields": fields})
