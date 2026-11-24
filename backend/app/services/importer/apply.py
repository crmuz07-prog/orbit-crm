"""Applies a mapped sheet: one deal (with contact, lead source, notes and next task) per row; re-import updates."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.models import Activity, Contact, CustomField, Deal, InboundLead, RecordEvent
from app.schemas.imports import ColumnMap, ImportResult
from app.services.importer import values as v
from app.services.importer.lookups import Lookups
from app.services.importer.reader import Cell
from app.services.phone_match import find_contact

ATTRIBUTION = ("campaign", "adset", "ad_name", "form_name")


class Importer:
    def __init__(self, db: Session, workspace_id: str, user_id: str, pipeline_id: str, columns: list[ColumnMap]) -> None:
        self.db, self.workspace_id, self.user_id = db, workspace_id, user_id
        self.result = ImportResult()
        self.look = Lookups(db, workspace_id, pipeline_id, self.result)
        self.columns = [c for c in columns if c.target != "ignore"]
        self.custom: list[tuple[ColumnMap, CustomField]] = []
        for column in self.columns:
            if column.target in ("custom", "new_custom") and (field := self.look.field(column)):
                self.custom.append((column, field))

    def run(self, rows: list[list[Cell]]) -> ImportResult:
        for row in rows:
            self.row(row)
        self.db.commit()
        return self.result

    def cell(self, row: list[Cell], target: str) -> Cell:
        column = next((c for c in self.columns if c.target == target), None)
        return row[column.column] if column and column.column < len(row) else None

    def row(self, row: list[Cell]) -> None:
        name, phone = v.text(self.cell(row, "contact_name")), v.phone(self.cell(row, "phone"))
        email = v.text(self.cell(row, "email")).lower() or None
        # Meta's "test lead" rows (dummy data from the form preview) are not customers.
        if not (name or phone or email) or any(v.text(c).startswith("<test lead") for c in row):
            self.result.skipped += 1
            return
        external = v.lead_id(self.cell(row, "external_id"))
        created = v.when(self.cell(row, "created_at"))
        lead = self.existing_lead(external)
        deal = self.db.get(Deal, lead.deal_id) if lead and lead.deal_id else None
        contact = (self.db.get(Contact, deal.contact_id) if deal and deal.contact_id else None) or self.find_contact(phone, email)
        if contact is None:
            contact = Contact(workspace_id=self.workspace_id, first_name=(name or phone or email or "")[:80], last_name="", phone=phone,
                              email=email, created_at=created or utcnow())
            self.db.add(contact)
            self.db.flush()
        deal = deal or self.contact_deal(contact)
        is_new = deal is None
        lead = lead or (self.lead_of(deal.id) if deal else None)
        deal = self.save_deal(deal, row, contact, name or contact.first_name, created)
        self.save_lead(lead, deal, contact, row, external, created)
        self.save_note(deal, row)
        self.save_task(deal, row, contact.first_name)
        if is_new:
            self.result.created += 1
            self.db.add(RecordEvent(workspace_id=self.workspace_id, deal_id=deal.id, actor_id=self.user_id, kind="created",
                                    changes={"stage_id": deal.stage_id}, created_at=deal.created_at))
        else:
            self.result.updated += 1

    def existing_lead(self, external: str | None) -> InboundLead | None:
        if not external:
            return None
        query = select(InboundLead).where(InboundLead.workspace_id == self.workspace_id, InboundLead.external_id == external)
        return self.db.scalars(query).first()

    def lead_of(self, deal_id: str) -> InboundLead | None:
        return self.db.scalars(select(InboundLead).where(InboundLead.workspace_id == self.workspace_id, InboundLead.deal_id == deal_id)).first()

    def find_contact(self, phone: str | None, email: str | None) -> Contact | None:
        if phone and (found := find_contact(self.db, self.workspace_id, phone)):
            return found
        if email:
            return self.db.scalar(select(Contact).where(Contact.workspace_id == self.workspace_id, Contact.email == email))
        return None

    def contact_deal(self, contact: Contact) -> Deal | None:
        """Without a lead id, the same person in the same pipeline is the same deal (no duplicates on re-import)."""
        stage_ids = [s.id for s in self.look.stage_list]
        query = select(Deal).where(Deal.contact_id == contact.id, Deal.stage_id.in_(stage_ids)).order_by(Deal.created_at.desc())
        return self.db.scalars(query).first()

    def save_deal(self, deal: Deal | None, row: list[Cell], contact: Contact, name: str, created: Any) -> Deal:
        stage_name = v.text(self.cell(row, "stage"))
        stage = self.look.stage(stage_name) if stage_name else (self.look.stages_by_id(deal.stage_id) if deal else self.look.first_open_stage())
        now = utcnow()
        if deal is None:
            platform = v.platform(self.cell(row, "platform"))
            deal = Deal(workspace_id=self.workspace_id, contact_id=contact.id, title=name[:200], stage_id=stage.id, custom={},
                        owner_id=self.user_id, source=platform.capitalize() if platform else "Import", created_at=created or now,
                        stage_entered_at=created or now)
            self.db.add(deal)
        elif deal.stage_id != stage.id:
            deal.stage_id, deal.stage_entered_at = stage.id, now
        if any(c.target == "owner" for c in self.columns):
            deal.owner_id = self.look.owner(v.text(self.cell(row, "owner")))
            contact.owner_id = contact.owner_id or deal.owner_id
        if title := v.text(self.cell(row, "title")):
            deal.title = title[:200]
        if (amount := v.number(self.cell(row, "amount"))) is not None:
            deal.amount = amount
        if source := v.text(self.cell(row, "source")):
            deal.source = source[:40]
        deal.closed_at = (deal.closed_at or deal.stage_entered_at or now) if stage.is_closed else None
        reason = v.text(self.cell(row, "lost_reason"))
        if not stage.is_lost:
            deal.lost_reason = None
        elif reason:
            deal.lost_reason = reason
            self.look.lost_reason(reason)
        deal.custom = {**(deal.custom or {}), **self.custom_values(row)}
        self.db.flush()
        return deal

    def custom_values(self, row: list[Cell]) -> dict[str, Any]:
        values: dict[str, Any] = {}
        for column, field in self.custom:
            raw = row[column.column] if column.column < len(row) else None
            value: Any
            if field.type == "number":
                value = v.number(raw)
            elif field.type == "date":
                value = v.day(raw)
            elif field.type == "multiselect":
                answer = v.answer(raw)
                value = [p.strip() for p in answer.split(",") if p.strip()] if answer else None
            elif field.type == "select":
                value = v.answer(raw)
            else:
                value = v.text(raw) or None
            if value is not None:
                self.look.grow_options(field, value if isinstance(value, list) else [str(value)])
                values[field.key] = value
        return values

    def save_lead(self, lead: InboundLead | None, deal: Deal, contact: Contact, row: list[Cell], external: str | None, created: Any) -> None:
        platform = v.platform(self.cell(row, "platform"))
        attribution = {k: v.text(self.cell(row, k))[:200] or None for k in ATTRIBUTION}
        if lead is None and not external and not platform and not any(attribution.values()):
            return
        if lead is None:
            lead = InboundLead(workspace_id=self.workspace_id, channel=platform or "import", kind="lead_form",
                               external_id=external or f"deal:{deal.id}", created_at=created or utcnow())
            self.db.add(lead)
        lead.deal_id, lead.contact_id, lead.platform = deal.id, contact.id, platform or lead.platform
        for key, value in attribution.items():
            setattr(lead, key, value or getattr(lead, key))

    def upsert_activity(self, external_id: str, **fields: Any) -> Activity:
        query = select(Activity).where(Activity.workspace_id == self.workspace_id, Activity.external_id == external_id)
        activity = self.db.scalars(query).first()
        if activity is None:
            activity = Activity(workspace_id=self.workspace_id, external_id=external_id)
            self.db.add(activity)
        for key, value in {"auto_logged": False, **fields}.items():
            setattr(activity, key, value)
        return activity

    def save_note(self, deal: Deal, row: list[Cell]) -> None:
        parts = [v.text(row[c.column]) for c in self.columns if c.target == "note" and c.column < len(row)]
        # Sheets often repeat the same comment in two columns; keep each text once.
        text = "\n".join(dict.fromkeys(p for p in parts if p))
        if text:
            # Same shape as a note typed in the card: first line is the subject, the body only when there is more.
            self.upsert_activity(f"import-note:{deal.id}", type="note", subject=text.split("\n")[0][:80], body=text if "\n" in text or len(text) > 80 else None, deal_id=deal.id,
                                 contact_id=deal.contact_id, owner_id=deal.owner_id, done=True, created_at=deal.created_at)

    def save_task(self, deal: Deal, row: list[Cell], name: str) -> None:
        """amoCRM rule: an open deal has a next step. The sheet's next contact date becomes an open call task."""
        due = v.task_due(self.cell(row, "next_contact"))
        stage = self.look.stages_by_id(deal.stage_id)
        if due is None or stage.is_closed:
            return
        query = select(Activity).where(Activity.workspace_id == self.workspace_id, Activity.external_id == f"import-task:{deal.id}")
        if self.db.scalars(query).first() is None:
            self.result.tasks_created += 1
        # "Call back <name>": the subject the PBX integration uses too; the UI shows it in the user's language.
        self.upsert_activity(f"import-task:{deal.id}", type="task", subject=f"Call back {name}"[:200], due_at=due, done=False, deal_id=deal.id,
                             contact_id=deal.contact_id, owner_id=deal.owner_id)
