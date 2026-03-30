from datetime import datetime
from fastapi import APIRouter, Depends, Query, Response, HTTPException, Request, BackgroundTasks

from app.api.deps.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from app.schemas.pagos import (
    GenerarPagosRequest,
    GenerarPagosResponse,
    PagoItem,
    PagosListResponse,
    WebhookPagoRequest,
    WebhookPagoResponse,
    PagoManualRequest,
)
from app.services.pagos import (
    generate_pagos,
    list_pagos_for_user,
    procesar_webhook_pasarela,
    registrar_pago_manual,
)
from app.services.reportes import exportar_pagos_excel, exportar_pagos_pdf
from app.services.auditoria import registrar_auditoria

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


@router.post("/generar", response_model=GenerarPagosResponse)
async def generar_cuotas(
    body: GenerarPagosRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> GenerarPagosResponse:
    result = generate_pagos(
        current_user=current_user,
        mes=body.mes,
        anio=body.anio,
        permitir_futuro=body.permitir_futuro,
    )
    return GenerarPagosResponse(**result)


@router.post("/webhook", response_model=WebhookPagoResponse)
async def webhook_pasarela(
    body: WebhookPagoRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> WebhookPagoResponse:
    """
    Endpoint para ser consumido por la pasarela de pagos (PSE, Bancolombia, etc.)
    para conciliar automáticamente el pago.
    """
    result = procesar_webhook_pasarela(payload=body)
    
    background_tasks.add(
        registrar_auditoria,
        entidad="pago",
        accion="webhook_conciliacion",
        detalles={"event_type": body.event_type, "estado": result.get("estado"), "transaccion_id": body.transaccion_id},
        user="WEBHOOK_PASARELA",
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return WebhookPagoResponse(**result)


@router.post("/{pago_id}/registrar-manual")
async def registrar_manual(
    pago_id: str,
    body: PagoManualRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """
    Endpoint para que un residente suba un comprobante de pago o el administrador concilie manualmente.
    """
    result = registrar_pago_manual(
        current_user=current_user,
        pago_id=pago_id,
        payload=body,
    )
    
    background_tasks.add(
        registrar_auditoria,
        entidad="pago",
        accion="registro_manual",
        detalles={"pago_id": pago_id, "metodo_pago": body.metodo_pago, "comprobante_url": body.comprobante_url},
        user=current_user,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return result


@router.get("/exportar")
async def exportar_pagos(
    formato: str = Query(..., description="excel o pdf"),
    residente_id: str | None = Query(default=None, alias="residenteId"),
    unidad_id: str | None = Query(default=None, alias="unidadId"),
    estado: str | None = Query(default=None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Exporta los pagos filtrados en formato PDF o Excel.
    """
    items = list_pagos_for_user(
        current_user=current_user,
        residente_id=residente_id,
        unidad_id=unidad_id,
        estado=estado,
        limit=1000,
    )

    if formato.lower() == "excel":
        file_bytes = exportar_pagos_excel(items)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"pagos_{datetime.now().strftime('%Y%m%d')}.xlsx"
    elif formato.lower() == "pdf":
        file_bytes = exportar_pagos_pdf(items)
        media_type = "application/pdf"
        filename = f"pagos_{datetime.now().strftime('%Y%m%d')}.pdf"
    else:
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Use 'excel' o 'pdf'."
        )

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

