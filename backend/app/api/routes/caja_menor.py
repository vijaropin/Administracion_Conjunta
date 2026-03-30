from fastapi import APIRouter, Depends

from app.api.deps.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.caja_menor import CajaMenorCloseRequest, CajaMenorCreateRequest, GastoCajaMenorRequest
from app.services.caja_menor import close_caja_menor, create_caja_menor, create_gasto_caja_menor

router = APIRouter(prefix="/cajas")

@router.post("/")
async def crear_caja(
    payload: CajaMenorCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return create_caja_menor(current_user, payload)

@router.post("/{caja_id}/cerrar")
async def cerrar_caja(
    caja_id: str,
    # payload opcional
    payload: CajaMenorCloseRequest | None = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return close_caja_menor(current_user, caja_id)

@router.post("/{caja_id}/gastos")
async def crear_gasto(
    caja_id: str,
    payload: GastoCajaMenorRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return create_gasto_caja_menor(current_user, caja_id, payload)
