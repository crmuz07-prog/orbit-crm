from fastapi import APIRouter

from app.api.crud_router import EntitySpec, build_crud_router
from app.models import Activity, Company, Contact, Deal, Pipeline, Stage
from app.schemas import crm as s
from app.services.rules import apply_deal_stage_rules, guard_stage_delete

SPECS = [
    EntitySpec(
        path="stages", model=Stage, create=s.StageIn, patch=s.StagePatch, read=s.StageOut,
        order_by=Stage.position, before_delete=guard_stage_delete, write_role="admin", references={"pipeline_id": Pipeline},
    ),
    EntitySpec(
        path="companies", module="companies", model=Company, create=s.CompanyIn, patch=s.CompanyPatch, read=s.CompanyOut,
        order_by=Company.name,
    ),
    EntitySpec(
        path="contacts", module="contacts", model=Contact, create=s.ContactIn, patch=s.ContactPatch, read=s.ContactOut,
        order_by=Contact.first_name, references={"company_id": Company},
    ),
    EntitySpec(
        path="deals", module="deals", model=Deal, create=s.DealIn, patch=s.DealPatch, read=s.DealOut,
        order_by=Deal.created_at.desc(), before_save=apply_deal_stage_rules,
        references={"company_id": Company, "contact_id": Contact, "stage_id": Stage},
    ),
    EntitySpec(
        path="activities", module="activities", model=Activity, create=s.ActivityIn, patch=s.ActivityPatch, read=s.ActivityOut,
        order_by=Activity.created_at.desc(),
        references={"deal_id": Deal, "company_id": Company, "contact_id": Contact},
    ),
]

router = APIRouter()
for spec in SPECS:
    router.include_router(build_crud_router(spec))
