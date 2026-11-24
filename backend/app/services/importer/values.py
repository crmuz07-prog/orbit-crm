"""Turns raw cells into CRM values: dates, phones, names, Meta's snake_case answers."""

import re
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.services.importer.reader import Cell, preview_cell

PLATFORMS = {"ig": "instagram", "fb": "facebook", "an": "audience_network", "msg": "messenger", "wa": "whatsapp"}
# Day-first, as typed in Uzbekistan / Russia ("23.11.2026"), then ISO.
DATE_FORMATS = ("%d.%m.%Y %H:%M", "%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d")


def local_zone() -> ZoneInfo:
    return ZoneInfo(get_settings().billing_timezone)


def text(value: Cell) -> str:
    return re.sub(r"\s+", " ", preview_cell(value)).strip()


def answer(value: Cell) -> str | None:
    """A list answer: Meta's "do'kon_/_supermarket" → "do'kon / supermarket"; 0 means "not filled" in these sheets."""
    raw = text(value)
    if raw in ("", "0", "-"):
        return None
    if " " not in raw and "_" in raw:
        raw = raw.replace("_/_", " / ").replace("_", " ")
    return raw


def phone(value: Cell) -> str | None:
    raw = text(value).removeprefix("p:").strip()
    digits = re.sub(r"\D", "", raw)
    if len(digits) < 7:
        return None
    # A bare 9-digit Uzbek number gets its country code, so calls and matching work.
    return f"+998{digits}" if len(digits) == 9 else ("+" + digits if not raw.startswith("+") else raw)


def when(value: Cell) -> datetime | None:
    """A moment in UTC. Naive values are local time (the platform time zone)."""
    if isinstance(value, datetime):
        moment = value
    elif isinstance(value, date):
        moment = datetime.combine(value, time())
    else:
        raw = text(value)
        if not raw:
            return None
        try:
            moment = datetime.fromisoformat(raw)
        except ValueError:
            moment = next((m for f in DATE_FORMATS if (m := _parse(raw, f))), None)  # type: ignore[assignment]
            if moment is None:
                return None
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=local_zone())
    return moment.astimezone(UTC)


def _parse(raw: str, fmt: str) -> datetime | None:
    try:
        return datetime.strptime(raw, fmt)
    except ValueError:
        return None


def day(value: Cell) -> str | None:
    """A calendar date (ISO) for date fields."""
    moment = when(value)
    return moment.astimezone(local_zone()).date().isoformat() if moment else None


def task_due(value: Cell) -> datetime | None:
    """A next-contact date without a time is a call that morning (10:00 local), as a manager would plan it."""
    moment = when(value)
    if moment is None:
        return None
    local = moment.astimezone(local_zone())
    if local.time() == time():
        local = local + timedelta(hours=10)
    return local.astimezone(UTC)


def number(value: Cell) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    raw = re.sub(r"[^\d.,-]", "", text(value)).replace(",", ".")
    try:
        return float(raw) if raw else None
    except ValueError:
        return None


def platform(value: Cell) -> str | None:
    raw = text(value).lower()
    return PLATFORMS.get(raw, raw or None)


def lead_id(value: Cell) -> str | None:
    return text(value).removeprefix("l:") or None


def meta_id(value: Cell) -> str | None:
    """Meta export ids carry a type prefix ("ag:1202…" ad, "f:2670…" form); the number is what the Graph API uses."""
    return re.sub(r"^[a-z]{1,3}:", "", text(value))[:64] or None
