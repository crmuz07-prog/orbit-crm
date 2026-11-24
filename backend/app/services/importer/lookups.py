"""Resolves names in the sheet to CRM records: stages, managers, fields, loss reasons (creating what is missing)."""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFound
from app.models import Company, CustomField, LostReason, Pipeline, Stage
from app.schemas.imports import ColumnMap, ImportResult
from app.services import team
from app.services.custom_fields import add_options, assign_key, fields_for

# Stage names that mean the deal is closed (uz / ru / en), for stages the import creates.
LOST_WORDS = ("rad et", "отказ", "lost", "yutqaz", "проигр", "otkaz")
WON_WORDS = ("muvaffaqiyatli", "успешн", "won", "yutildi", "оплачен", "sotildi")
PALETTE = ("blue", "violet", "amber", "orange", "slate")


def norm(name: str) -> str:
    return re.sub(r"\s+", " ", name).strip().casefold()


class Lookups:
    def __init__(self, db: Session, workspace_id: str, pipeline_id: str, result: ImportResult) -> None:
        self.db, self.workspace_id, self.result = db, workspace_id, result
        self.pipeline = db.get(Pipeline, pipeline_id)
        if self.pipeline is None or self.pipeline.workspace_id != workspace_id:
            raise NotFound("Pipeline not found", "not_found")
        query = select(Stage).where(Stage.pipeline_id == pipeline_id).order_by(Stage.position)
        self.stage_list = list(db.scalars(query))
        self.stages = {norm(s.name): s for s in self.stage_list}
        self.members: dict[str, str] = {}
        for membership, user in team.members(db, workspace_id):
            if user.is_active:
                self.members[norm(user.full_name)] = membership.user_id
                self.members.setdefault(norm(user.full_name.split()[0]), membership.user_id)
        self.fields = {f.key: f for f in fields_for(db, workspace_id)}
        self.reasons = {norm(r.name) for r in db.scalars(select(LostReason).where(LostReason.workspace_id == workspace_id))}
        self.companies = {norm(c.name): c for c in db.scalars(select(Company).where(Company.workspace_id == workspace_id))}

    def company(self, name: str, owner_id: str | None) -> Company:
        """The same name (case and spacing aside) is the same company; a new one belongs to the deal's manager."""
        found = self.companies.get(norm(name))
        if found:
            return found
        company = Company(workspace_id=self.workspace_id, name=name.strip()[:200], owner_id=owner_id, lifecycle="lead")
        self.db.add(company)
        self.db.flush()
        self.companies[norm(name)] = company
        self.result.companies_created += 1
        return company

    def follow_order(self, names: list[str]) -> None:
        """The sheet's stage list is the funnel: its stages take that order (open first, then won / lost); others keep theirs after."""
        listed = [self.stages[norm(n)] for n in names if norm(n) in self.stages]
        rest = [s for s in self.stage_list if s not in listed]
        ordered = [s for s in listed if not s.is_closed] + [s for s in rest if not s.is_closed] + [s for s in listed if s.is_closed] + [s for s in rest if s.is_closed]
        self.stage_list[:] = ordered
        for position, stage in enumerate(ordered):
            stage.position = position

    def own_company(self, name: str, owner_id: str | None) -> Company:
        """A company for one person: never matched by name, so two leads called "Doniyor" are two companies."""
        company = Company(workspace_id=self.workspace_id, name=name.strip()[:200] or "—", owner_id=owner_id, lifecycle="lead")
        self.db.add(company)
        self.db.flush()
        self.result.companies_created += 1
        return company

    def describe(self, stage: Stage, description: str | None) -> None:
        if description and not stage.description:
            stage.description = description[:500]

    def stages_by_id(self, stage_id: str) -> Stage:
        # A re-imported deal may sit in another pipeline; its own stage still decides open/closed.
        return next((s for s in self.stage_list if s.id == stage_id), None) or self.db.get(Stage, stage_id) or self.first_open_stage()

    def first_open_stage(self) -> Stage:
        stage = next((s for s in self.stage_list if not s.is_closed), None)
        return stage or self.stage("Yangi lid")  # an empty pipeline gets its first stage

    def stage(self, name: str) -> Stage:
        found = self.stages.get(norm(name))
        if found:
            return found
        lowered = norm(name)
        lost, won = any(w in lowered for w in LOST_WORDS), any(w in lowered for w in WON_WORDS)
        open_count = sum(1 for s in self.stage_list if not s.is_closed)
        stage = Stage(workspace_id=self.workspace_id, pipeline_id=self.pipeline.id, name=name.strip()[:80], is_lost=lost, is_won=won,
                      probability=100 if won else 0 if lost else 30, color="emerald" if won else "rose" if lost else PALETTE[open_count % 5])
        # Open stages go before the closed ones, closed stages at the end.
        self.stage_list.insert(len(self.stage_list) if (lost or won) else open_count, stage)
        for position, s in enumerate(self.stage_list):
            s.position = position
        self.db.add(stage)
        self.db.flush()
        self.stages[lowered] = stage
        self.result.stages_created.append(stage.name)
        return stage

    def owner(self, name: str) -> str | None:
        found = self.members.get(norm(name)) or self.members.get(norm(name.split()[0])) if name.strip() else None
        if name.strip() and not found and name.strip() not in self.result.unmatched_owners:
            self.result.unmatched_owners.append(name.strip())
        return found

    def field(self, column: ColumnMap) -> CustomField | None:
        """The column's field; a new one is created once (or an existing field with the same label is reused)."""
        if column.target == "custom":
            return self.fields.get(column.field_key or "")
        label = (column.new_label or column.header).strip()[:80]
        existing = next((f for f in self.fields.values() if norm(f.label) == norm(label)), None)
        if existing:
            return existing
        field = CustomField(workspace_id=self.workspace_id, entity="deal", label=label, type=column.new_type or "text",
                            options=[], warn_options=[], position=len(self.fields))
        assign_key(self.db, field, set())
        self.db.add(field)
        self.db.flush()
        self.fields[field.key] = field
        self.result.fields_created.append(label)
        return field

    def grow_options(self, field: CustomField, values: list[str]) -> None:
        if field.type in ("select", "multiselect"):
            add_options(field, values)

    def lost_reason(self, name: str) -> None:
        if norm(name) not in self.reasons:
            self.db.add(LostReason(workspace_id=self.workspace_id, name=name[:120], position=len(self.reasons)))
            self.reasons.add(norm(name))

    def reasons_follow(self, names: list[str]) -> None:
        """Loss reasons take the sheet's order (the lost dialog and the report list them that way)."""
        self.db.flush()
        order = {norm(n): i for i, n in enumerate(names)}
        rows = list(self.db.scalars(select(LostReason).where(LostReason.workspace_id == self.workspace_id)))
        for i, reason in enumerate(sorted(rows, key=lambda r: (order.get(norm(r.name), len(order)), r.position))):
            reason.position = i
