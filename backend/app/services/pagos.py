from fastapi import HTTPException, status
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.schemas.auth import AuthenticatedUser

READ_ROLES = {"administrador", "consejo", "contadora", "residente"}


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
