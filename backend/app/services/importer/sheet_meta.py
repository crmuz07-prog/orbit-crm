"""What a workbook knows beyond its cells: dropdown lists, a lists sheet with descriptions, red colour rules.

A client's sheet encodes its sales process this way (stage order and meaning, the full list of loss reasons, which values
need attention); the import turns that into stages, loss reasons, list options and warning values.
"""

import io
import re
from dataclasses import dataclass, field

from openpyxl import load_workbook
from openpyxl.utils import column_index_from_string, range_boundaries
from openpyxl.worksheet.worksheet import Worksheet

DESCRIPTION_HEADERS = ("izoh", "description", "описание", "tavsif", "comment", "комментарий", "пояснение")
# `$W2="0–100 kg"`: the rule colours cells equal to one value.
EQUALS_RULE = re.compile(r'^\$?([A-Z]{1,3})\$?\d+\s*=\s*"([^"]+)"$')
MAX_VALUE = 120


@dataclass
class ColumnMeta:
    options: list[str] = field(default_factory=list)
    descriptions: dict[str, str] = field(default_factory=dict)
    warn: list[str] = field(default_factory=list)


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value)).strip() if value is not None else ""


def key(header: str) -> str:
    return clean(header).casefold()


def is_red(rgb: str | None) -> bool:
    """Light or strong red fills (FECACA, F8CFCF, FF0000) — not yellow, orange or green."""
    if not rgb or len(rgb) < 6:
        return False
    r, g, b = (int(rgb[-6:][i:i + 2], 16) for i in (0, 2, 4))
    return r - g >= 0x20 and r - b >= 0x20 and abs(g - b) <= 0x30


def _add(target: list[str], values: list[str]) -> None:
    for v in values:
        if v and len(v) <= MAX_VALUE and v not in target:
            target.append(v)


def _dropdowns(sheet: Worksheet, book_sheets: dict[str, Worksheet], meta: dict[int, ColumnMeta]) -> None:
    for dv in sheet.data_validations.dataValidation:
        if dv.type != "list" or not dv.formula1:
            continue
        formula = dv.formula1.strip()
        if formula.startswith('"'):
            values = [clean(v) for v in formula.strip('"').split(",")]
        else:  # a range on another sheet: 'Lists'!$A$2:$A$9
            name, _, ref = formula.lstrip("=").rpartition("!")
            source = book_sheets.get(name.strip("'")) if name else sheet
            if source is None:
                continue
            values = [clean(c.value) for row in source[ref.replace("$", "")] for c in (row if isinstance(row, tuple) else (row,))]
        for rng in str(dv.sqref).split():
            min_col, _, max_col, _ = range_boundaries(rng)
            for col in range(min_col or 1, (max_col or min_col or 1) + 1):
                _add(meta.setdefault(col - 1, ColumnMeta()).options, values)


def _lists_sheets(main: Worksheet, sheets: list[Worksheet], headers: list[str], meta: dict[int, ColumnMeta]) -> None:
    """A column on another sheet titled like a data column lists its values (and the next column describes them)."""
    wanted = {key(h): i for i, h in enumerate(headers) if clean(h)}
    for sheet in sheets:
        if sheet is main:
            continue
        top = [clean(c.value) for c in next(sheet.iter_rows(min_row=1, max_row=1), ())]
        for j, title in enumerate(top):
            index = wanted.get(key(title))
            if index is None:
                continue
            column = meta.setdefault(index, ColumnMeta())
            explains = j + 1 < len(top) and key(top[j + 1]) in DESCRIPTION_HEADERS
            for row in sheet.iter_rows(min_row=2, values_only=True):
                value = clean(row[j]) if j < len(row) else ""
                if not value:
                    break  # the list ends at the first empty cell (notes may follow further down)
                _add(column.options, [value])
                note = clean(row[j + 1]) if explains and j + 1 < len(row) else ""
                if note:
                    column.descriptions[value] = note


def _red_rules(sheet: Worksheet, meta: dict[int, ColumnMeta]) -> None:
    for rules in sheet.conditional_formatting._cf_rules.values():
        for rule in rules:
            fill = rule.dxf.fill if rule.dxf else None
            rgb = (fill.fgColor.rgb or fill.bgColor.rgb) if fill else None
            match = EQUALS_RULE.match((rule.formula or [""])[0]) if rule.type == "expression" else None
            if match and is_red(rgb if isinstance(rgb, str) else None):
                _add(meta.setdefault(column_index_from_string(match.group(1)) - 1, ColumnMeta()).warn, [clean(match.group(2))])


def read_meta(content: bytes, headers: list[str]) -> dict[int, ColumnMeta]:
    """Column index → what the workbook says about that column. Empty for CSV or anything unreadable."""
    try:
        book = load_workbook(io.BytesIO(content))
    except Exception:  # metadata is a bonus: the values were already read
        return {}
    main = book.worksheets[0]
    meta: dict[int, ColumnMeta] = {}
    _lists_sheets(main, book.worksheets, headers, meta)
    _dropdowns(main, {s.title: s for s in book.worksheets}, meta)
    _red_rules(main, meta)
    return meta
