import math
from datetime import datetime, timezone
from fastapi import HTTPException
from firebase_admin import firestore

from app.core.firebase import db
from app.schemas.auth import AuthenticatedUser
from app.schemas.caja_menor import CajaMenorCreateRequest, GastoCajaMenorRequest


def create_caja_menor(current_user: AuthenticatedUser, payload: CajaMenorCreateRequest) -> dict:
    conjunto_id = current_user.conjunto_id
    if not conjunto_id:
        raise HTTPException(status_code=400, detail="Usuario no asociado a un conjunto")

    cajas_ref = db.collection("cajasMenores")
    doc_ref = cajas_ref.document()

    nueva_caja = {
        "conjuntoId": conjunto_id,
        "montoAprobado": payload.monto_aprobado,
        "fechaAprobacion": payload.fecha_aprobacion,
        "aprobadoPor": current_user.uid,
        "estado": "abierta",
        "observaciones": payload.observaciones,
        "fechaCreacion": datetime.now(timezone.utc)
    }

    doc_ref.set(nueva_caja)
    nueva_caja["id"] = doc_ref.id
    return nueva_caja


def close_caja_menor(current_user: AuthenticatedUser, caja_id: str) -> dict:
    caja_ref = db.collection("cajasMenores").document(caja_id)
    caja_doc = caja_ref.get()

    if not caja_doc.exists:
        raise HTTPException(status_code=404, detail="Caja menor no encontrada")
    
    caja_data = caja_doc.to_dict()
    if caja_data.get("estado") == "cerrada":
        raise HTTPException(status_code=400, detail="La caja menor ya se encuentra cerrada")

    update_payload = {
        "estado": "cerrada",
        "cerradoPor": current_user.uid,
        "fechaCierre": datetime.now(timezone.utc)
    }
    caja_ref.update(update_payload)
    
    return {"id": caja_id, "status": "cerrada", "cerradoPor": current_user.uid}


def create_gasto_caja_menor(current_user: AuthenticatedUser, caja_id: str, payload: GastoCajaMenorRequest) -> dict:
    caja_ref = db.collection("cajasMenores").document(caja_id)
    caja_doc = caja_ref.get()

    if not caja_doc.exists:
        raise HTTPException(status_code=404, detail="Caja menor no encontrada")
    
    caja_data = caja_doc.to_dict()
    if caja_data.get("estado") != "abierta":
        raise HTTPException(status_code=400, detail="No se pueden añadir gastos a una caja cerrada")

    # Verificar que el gasto no exceda el presupuesto de la caja
    monto_aprobado = caja_data.get("montoAprobado", 0.0)
    gastos_query = db.collection("gastosCajaMenor").where(
        filter=firestore.FieldFilter("cajaMenorId", "==", caja_id)
    ).stream()
    
    gastos_acumulados = sum([g.to_dict().get("valor", 0.0) for g in gastos_query])
    
    if gastos_acumulados + payload.valor > monto_aprobado:
        raise HTTPException(
            status_code=400, 
            detail=f"El valor excede el presupuesto disponible de la caja. Disponible: {monto_aprobado - gastos_acumulados}"
        )

    gastos_ref = db.collection("gastosCajaMenor")
    doc_ref = gastos_ref.document()

    nuevo_gasto = {
        "cajaMenorId": caja_id,
        "conjuntoId": caja_data.get("conjuntoId"),
        "concepto": payload.concepto,
        "valor": payload.valor,
        "fechaGasto": payload.fecha_gasto,
        "soporteNombre": payload.soporte_nombre,
        "soporteUrl": payload.soporte_url,
        "registradoPor": current_user.uid,
        "fechaCreacion": datetime.now(timezone.utc)
    }

    doc_ref.set(nuevo_gasto)
    nuevo_gasto["id"] = doc_ref.id
    return nuevo_gasto
