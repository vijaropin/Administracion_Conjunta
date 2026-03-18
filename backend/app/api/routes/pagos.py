from fastapi import APIRouter, Depends, Query

from app.api.deps.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.pagos import PagoItem, PagosListResponse
from app.services.pagos import list_pagos_for_user

router = APIRouter(prefix="/pagos")


@router.get("", response_model=PagosListResponse)
async def list_pagos(
    residente_id: str | None = Query(default=None, alias="residenteId"),
    unidad_id: str | None = Query(default=None, alias="unidadId"),
    estado: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PagosListResponse:
    items = list_pagos_for_user(
        current_user=current_user,
        residente_id=residente_id,
        unidad_id=unidad_id,
        estado=estado,
        limit=limit,
    )

    return PagosListResponse(
        total=len(items),
        items=[PagoItem.model_validate(item) for item in items],
    )
