"""Suggests what each column means, from its header and values (Meta lead exports and typical CRM sheets)."""

from datetime import date, datetime

from app.models import CustomField
from app.schemas.imports import ColumnMap
from app.services.custom_fields import slug
from app.services.importer.reader import Cell, preview_cell

# Targets a column can carry at most once (notes may come from several columns).
SINGLE = {"external_id", "title", "contact_name", "phone", "email", "created_at", "stage", "owner", "amount", "source",
          "lost_reason", "next_contact", "platform", "campaign", "adset", "ad_name", "form_name"}
# Header fragments (lower-case, any language the clients use); the first matching rule wins.
ALIASES: list[tuple[str, tuple[str, ...]]] = [
    ("ignore", ("ad_id", "adset_id", "campaign_id", "form_id", "is_organic", "lead_status", "lid sanasi", "ogohlantirish")),
    ("created_at", ("created_time", "created at", "дата создания", "yaratilgan")),
    ("campaign", ("campaign_name", "campaign", "кампания", "kampaniya")),
    ("adset", ("adset_name", "ad set", "adset", "группа объявлений")),
    ("ad_name", ("ad_name", "объявление", "reklama nomi")),
    ("form_name", ("form_name", "форма")),
    ("platform", ("platform", "платформа")),
    ("phone", ("phone_number", "phone", "телефон", "telefon")),
    ("email", ("email", "e-mail", "почта")),
    ("contact_name", ("full_name", "ismingiz", "имя", "фио", "contact", "kontakt", "mijoz ismi", "name")),
    ("stage", ("bosqich", "stage", "этап", "статус сделки")),
    ("note", ("izoh", "comment", "коммент", "note", "примечан")),
    ("owner", ("menejer", "manager", "менеджер", "owner", "mas'ul", "masʼul", "ответствен")),
    ("lost_reason", ("rad etish", "lost reason", "причина отказа", "отказ")),
    ("next_contact", ("keyingi aloqa", "next contact", "следующ")),
    ("amount", ("amount", "summa", "сумма", "budget", "byudjet", "бюджет")),
    ("source", ("source", "manba", "источник")),
    ("title", ("title", "deal", "сделка", "bitim")),
]


# Meta's own export columns win over a form's free-typed duplicates (phone_number over "telefon raqamingiz").
STANDARD = ("phone_number", "full_name", "email", "created_time")


def label_for(header: str) -> str:
    return header.replace("_/_", " / ").replace("_", " ").strip(" ?")[:80] or header[:80]


def target_for(header: str) -> str | None:
    h = header.lower()
    return next((target for target, words in ALIASES if any(w in h for w in words)), None)


def guess_type(values: list[Cell]) -> str:
    filled = [v for v in values if v not in (None, "")]
    if filled and all(isinstance(v, (datetime, date)) for v in filled):
        return "date"
    if filled and all(isinstance(v, (int, float)) for v in filled):
        return "number"
    texts = [preview_cell(v) for v in filled]
    distinct = set(texts)
    if texts and len(distinct) <= 25 and len(distinct) < len(texts):
        return "multiselect" if any(", " in t for t in distinct) else "select"
    return "text"


def suggest(headers: list[str], rows: list[list[Cell]], fields: list[CustomField]) -> list[ColumnMap]:
    by_label = {f.label.lower(): f for f in fields} | {f.key: f for f in fields}
    used: set[str] = set()
    result: dict[int, ColumnMap] = {}
    order = sorted(range(len(headers)), key=lambda i: headers[i].lower() not in STANDARD)
    for i in order:
        header = headers[i]
        values = [r[i] for r in rows]
        samples = [preview_cell(v) for v in values if v not in (None, "")][:3]
        target = "external_id" if samples and all(s.startswith("l:") for s in samples) else target_for(header)
        if not samples:
            target = "ignore"
        if target in SINGLE and target in used:
            target = "ignore"
        mapped = ColumnMap(column=i, header=header, samples=samples, target=target or "custom")
        if target is None:
            existing = by_label.get(header.lower()) or by_label.get(slug(header))
            kind = guess_type(values)
            if existing:
                mapped.field_key = existing.key
            elif header.startswith("#") and kind == "text":
                mapped.target = "note"  # an unnamed column of free text is the manager's notes
            else:
                mapped.target, mapped.new_label, mapped.new_type = "new_custom", label_for(header), kind
        used.add(mapped.target)
        result[i] = mapped
    return [result[i] for i in range(len(headers))]
