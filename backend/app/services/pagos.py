from datetime import datetime, timezone

from fastapi import HTTPException, status
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.schemas.auth import AuthenticatedUser

READ_ROLES = {"administrador", "consejo", "contadora", "residente"}
GENERATE_ROLES = {"administrador"}

# ============================
# Lectura de pagos existentes
# ============================


def list_pagos_for_user(
    current_user: AuthenticatedUser,
    residente_id: str | None = None,
    unidad_id: str | None = None,
    estado: str | None = None,
    limit: int = 50,
) -> list[dict]:
    if current_user.tipo not in READ_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This role cannot read payments",
        )

    db = firestore.client()
    query = db.collection("pagos").where(
        filter=FieldFilter("conjuntoId", "==", current_user.conjunto_id)
    )

    if current_user.tipo == "residente":
        query = query.where(filter=FieldFilter("residenteId", "==", current_user.uid))
    elif residente_id:
        query = query.where(filter=FieldFilter("residenteId", "==", residente_id))

    if unidad_id:
        query = query.where(filter=FieldFilter("unidadId", "==", unidad_id))

    if estado:
        query = query.where(filter=FieldFilter("estado", "==", estado))

    query = query.order_by("fechaVencimiento", direction=firestore.Query.DESCENDING).limit(limit)

    items: list[dict] = []
    for document in query.stream():
        item = document.to_dict() or {}
        item["id"] = document.id
        items.append(item)

    return items


# ============================
# Generación masiva de cuotas
# ============================


def _get_conjunto_config(conjunto_id: str) -> dict:
    db = firestore.client()
    snap = db.collection("conjuntos").document(conjunto_id).get()
    if not snap.exists:
        return {}
    return snap.to_dict() or {}


def _is_concepto_vigente(concepto: dict, referencia: datetime) -> bool:
    desde = concepto.get("fechaVigenciaDesde")
    hasta = concepto.get("fechaVigenciaHasta")
    if isinstance(desde, datetime) and desde.tzinfo is None:
        desde = desde.replace(tzinfo=timezone.utc)
    if isinstance(hasta, datetime) and hasta.tzinfo is None:
        hasta = hasta.replace(tzinfo=timezone.utc)
    if isinstance(desde, datetime) and referencia < desde:
        return False
    if isinstance(hasta, datetime) and referencia > hasta:
        return False
    return True


def generate_pagos(
    *,
    current_user: AuthenticatedUser,
    mes: int,
    anio: int,
    permitir_futuro: bool = False,
) -> dict:
    if current_user.tipo not in GENERATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can generate monthly fees",
        )
    if mes < 1 or mes > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El mes debe estar entre 1 y 12",
        )

    today = datetime.now(timezone.utc).date()
    if not permitir_futuro and (anio > today.year or (anio == today.year and mes > today.month)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden generar cuotas para meses futuros",
        )

    db = firestore.client()

    # Datos base
    unidades = [
        {**(doc.to_dict() or {}), "id": doc.id}
        for doc in db.collection("unidades")
        .where(filter=FieldFilter("conjuntoId", "==", current_user.conjunto_id))
        .stream()
    ]
    conceptos = [
        {**(doc.to_dict() or {}), "id": doc.id}
        for doc in db.collection("conceptosPago")
        .where(filter=FieldFilter("conjuntoId", "==", current_user.conjunto_id))
        .where(filter=FieldFilter("activo", "==", True))
        .stream()
    ]
    referencia_periodo = datetime(anio, mes, 1, tzinfo=timezone.utc)
    conceptos = [c for c in conceptos if _is_concepto_vigente(c, referencia_periodo)]

    conjunto_cfg = _get_conjunto_config(current_user.conjunto_id)
    cuota_cfg = (conjunto_cfg or {}).get("cuotaAdministracion") or {}
    tasa_default = cuota_cfg.get("tasaInteresMoraMensual")

    creados = 0
    omitidos = 0
    dia_vencimiento = int(cuota_cfg.get("diaVencimiento") or 16)
    dia_corte_mora = int(cuota_cfg.get("diaCorteMora") or 16)
    fecha_vencimiento = datetime(anio, mes, dia_vencimiento, tzinfo=timezone.utc)

    for unidad in unidades:
        unidad_id = unidad.get("id")
        residente_id = unidad.get("residenteId") or unidad_id
        for concepto in conceptos:
            concepto_nombre = concepto.get("nombre") or "Cuota"

            dup_q = (
                db.collection("pagos")
                .where(filter=FieldFilter("conjuntoId", "==", current_user.conjunto_id))
                .where(filter=FieldFilter("unidadId", "==", unidad_id))
                .where(filter=FieldFilter("concepto", "==", concepto_nombre))
                .where(filter=FieldFilter("mes", "==", mes))
                .where(filter=FieldFilter("anio", "==", anio))
                .limit(1)
            )
            if list(dup_q.stream()):
                omitidos += 1
                continue

            valor = concepto.get("valorBase")
            if valor is None:
                valor = cuota_cfg.get("valorHastaDia16") or cuota_cfg.get("valorMensual") or 0

            concepto_lower = str(concepto_nombre).lower()
            es_cuota = "cuota" in concepto_lower and "admin" in concepto_lower
            valor_hasta_16 = cuota_cfg.get("valorHastaDia16") if es_cuota else None
            valor_desde_17 = cuota_cfg.get("valorDesdeDia17") if es_cuota else None

            payload = {
                "conjuntoId": current_user.conjunto_id,
                "unidadId": unidad_id,
                "residenteId": residente_id,
                "concepto": concepto_nombre,
                "valor": valor,
                "estado": "pendiente",
                "mes": mes,
                "anio": anio,
                "fechaVencimiento": fecha_vencimiento,
                "aplicaInteresMora": bool(concepto.get("aplicaInteresMora")),
                "tasaInteresMoraMensual": concepto.get("tasaInteresMoraMensual") or tasa_default,
                "valorHastaDia16": valor_hasta_16,
                "valorDesdeDia17": valor_desde_17,
                "multaDiaCorte": dia_corte_mora,
                "fechaCreacion": datetime.now(timezone.utc),
            }

            db.collection("pagos").add(payload)
            creados += 1

    return {
        "creados": creados,
        "omitidos_duplicado": omitidos,
        "total_unidades": len(unidades),
        "total_conceptos": len(conceptos),
    }
