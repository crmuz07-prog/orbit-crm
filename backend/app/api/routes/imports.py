from fastapi import APIRouter

from app.api.deps import AdminCtx
from app.schemas.imports import ImportFile, ImportPreview, ImportRequest, ImportResult
from app.services.importer import service

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/deals/preview", response_model=ImportPreview)
def preview(payload: ImportFile, ctx: AdminCtx) -> ImportPreview:
    """Columns of the uploaded sheet with a suggested meaning for each (nothing is saved)."""
    return service.preview(ctx.db, ctx.workspace_id, payload)


@router.post("/deals", response_model=ImportResult)
def import_deals(payload: ImportRequest, ctx: AdminCtx) -> ImportResult:
    return service.run(ctx.db, ctx.workspace_id, ctx.user.id, payload)
