from fastapi import APIRouter, BackgroundTasks, Depends, Request

from app.api.deps.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.caja_menor import CajaMenorCloseRequest, CajaMenorCreateRequest, GastoCajaMenorRequest
from app.services.auditoria import registrar_auditoria
from app.services.caja_menor import close_caja_menor, create_caja_menor, create_gasto_caja_menor

router = APIRouter(prefix="/cajas")


@router.post("/")
async def crear_caja(
    payload: CajaMenorCreateRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    result = create_caja_menor(current_user, payload)

    background_tasks.add_task(
        registrar_auditoria,
        entidad="caja_menor",
        accion="creacion",
        detalles={"monto_aprobado": payload.monto_aprobado, "caja_id": result.get("id")},
        user=current_user,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return result


@router.post("/{caja_id}/cerrar")
async def cerrar_caja(
    caja_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    payload: CajaMenorCloseRequest | None = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    result = close_caja_menor(current_user, caja_id)

    background_tasks.add_task(
        registrar_auditoria,
        entidad="caja_menor",
        accion="cierre",
        detalles={"caja_id": caja_id},
        user=current_user,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return result


@router.post("/{caja_id}/gastos")
async def crear_gasto(
    caja_id: str,
    payload: GastoCajaMenorRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    result = create_gasto_caja_menor(current_user, caja_id, payload)

    background_tasks.add_task(
        registrar_auditoria,
        entidad="gasto_caja_menor",
        accion="creacion",
        detalles={"caja_id": caja_id, "concepto": payload.concepto, "valor": payload.valor, "gasto_id": result.get("id")},
        user=current_user,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return result

