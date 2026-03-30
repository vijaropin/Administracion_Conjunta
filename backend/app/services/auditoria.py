import json
from datetime import datetime, timezone

from app.core.firebase import db
from app.schemas.auth import AuthenticatedUser


def registrar_auditoria(
    entidad: str,
    accion: str,
    detalles: dict,
    user: AuthenticatedUser | str,
    ip: str | None = None,
    user_agent: str | None = None
) -> None:
    """
    Guarda silenciosamente en Firestore un registro de auditoría.
    Al estar diseñado para ser invocado por `BackgroundTasks` de FastAPI, no bloquea el Hilo Principal web.
    """
    auditoria_ref = db.collection("auditoria")
    
    usuario_id = "SYSTEM"
    usuario_email = "SYSTEM"
    
    if isinstance(user, AuthenticatedUser):
        usuario_id = user.uid
        # Dependiendo del mapeo exacto de auth, puede que 'email' no viaje en el claim, se provee Fallback
        usuario_email = getattr(user, "email", "NO_DISPONIBLE_EN_TOKEN")
    elif isinstance(user, str):
        usuario_id = user
    
    # Prevenir que objetos Datetime o Pydantic Models quellen el cliente Firestore
    detalles_serializables = json.loads(json.dumps(detalles, default=str))

    auditoria_ref.document().set({
        "timestamp": datetime.now(timezone.utc),
        "usuarioId": usuario_id,
        "usuarioEmail": usuario_email,
        "ip": ip,
        "userAgent": user_agent,
        "entidad": entidad,
        "accion": accion,
        "detalles": detalles_serializables
    })
