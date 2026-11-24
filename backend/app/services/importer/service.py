"""Entry points used by the import routes."""

import base64
import binascii

from sqlalchemy.orm import Session

from app.core.errors import BadRequest
from app.schemas.imports import ImportFile, ImportPreview, ImportRequest, ImportResult
from app.services.custom_fields import fields_for
from app.services.importer.apply import Importer
from app.services.importer.mapping import suggest
from app.services.importer.reader import Cell, read_table
from app.services.importer.sheet_meta import ColumnMeta, read_meta

MAX_BYTES = 5 * 1024 * 1024


def decode(file: ImportFile) -> tuple[list[str], list[list[Cell]]]:
    try:
        content = base64.b64decode(file.content, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise BadRequest("The file could not be read", "import_bad_file") from exc
    if len(content) > MAX_BYTES:
        raise BadRequest("The file is larger than 5 MB", "import_too_large")
    return read_table(file.filename, content)


def sheet_meta(file: ImportFile, headers: list[str]) -> dict[int, ColumnMeta]:
    return read_meta(base64.b64decode(file.content), headers) if file.filename.lower().endswith((".xlsx", ".xlsm")) else {}


def preview(db: Session, workspace_id: str, file: ImportFile) -> ImportPreview:
    headers, rows = decode(file)
    return ImportPreview(rows=len(rows), columns=suggest(headers, rows, fields_for(db, workspace_id), sheet_meta(file, headers)))


def run(db: Session, workspace_id: str, user_id: str, request: ImportRequest) -> ImportResult:
    headers, rows = decode(request)
    return Importer(db, workspace_id, user_id, request.pipeline_id, request.columns, sheet_meta(request, headers)).run(rows)
