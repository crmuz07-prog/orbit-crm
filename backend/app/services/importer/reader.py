"""Reads an uploaded .xlsx / .csv into a header row and value rows."""

import csv
import io
import zipfile
from datetime import date, datetime
from typing import Any

from openpyxl import load_workbook

from app.core.errors import BadRequest

MAX_ROWS = 5000
Cell = str | float | datetime | date | None


MAX_UNPACKED = 80 * 1024 * 1024
MAX_RATIO = 100


def ensure_reasonable_zip(content: bytes) -> None:
    """An .xlsx is a zip: a few compressed megabytes can unpack to gigabytes (a zip bomb). Checked before parsing."""
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            unpacked = sum(info.file_size for info in archive.infolist())
    except zipfile.BadZipFile as exc:
        raise BadRequest("The file is not a valid Excel workbook", "import_bad_file") from exc
    if unpacked > MAX_UNPACKED or unpacked > MAX_RATIO * max(len(content), 1):
        raise BadRequest("The workbook is too large once unpacked", "import_too_large")


def _xlsx(content: bytes) -> list[list[Cell]]:
    ensure_reasonable_zip(content)
    try:
        # data_only: formulas come back as the values Excel / Google Sheets last calculated.
        book = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    except Exception as exc:  # openpyxl raises many types for a broken file
        raise BadRequest("The file is not a valid Excel workbook", "import_bad_file") from exc
    sheet = book.worksheets[0]
    return [list(row) for row in sheet.iter_rows(values_only=True)]


def _csv(content: bytes) -> list[list[Cell]]:
    text = content.decode("utf-8-sig", errors="replace")
    try:
        dialect: Any = csv.Sniffer().sniff(text[:4096], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    return [list(row) for row in csv.reader(io.StringIO(text), dialect)]


def _filled(row: list[Cell]) -> bool:
    return any(v not in (None, "") for v in row)


def read_table(filename: str, content: bytes) -> tuple[list[str], list[list[Cell]]]:
    rows = _xlsx(content) if filename.lower().endswith((".xlsx", ".xlsm")) else _csv(content)
    rows = [r for r in rows if _filled(r)]
    if not rows:
        raise BadRequest("The file has no rows", "import_empty")
    width = max(len(r) for r in rows)
    headers = [str(h).strip() if h not in (None, "") else f"#{i + 1}" for i, h in enumerate(rows[0] + [None] * (width - len(rows[0])))]
    body = [r + [None] * (width - len(r)) for r in rows[1:]]
    if len(body) > MAX_ROWS:
        raise BadRequest(f"At most {MAX_ROWS} rows per import", "import_too_many_rows")
    return headers, body


def preview_cell(value: Cell) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M") if value.time() != datetime.min.time() else value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return "" if value is None else str(value)
