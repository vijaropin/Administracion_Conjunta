from fastapi import Header, HTTPException, status
from firebase_admin import auth, firestore

from app.schemas.auth import AuthenticatedUser


def get_current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )

    token = authorization.replace("Bearer ", "", 1).strip()

    try:
        decoded_token = auth.verify_id_token(token)
    except Exception as error:  # pragma: no cover - depende de Firebase externo
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
        ) from error

    uid = decoded_token.get("uid")
    user_doc = firestore.client().collection("usuarios").document(uid).get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User document not found",
        )

    data = user_doc.to_dict() or {}
    if not data.get("activo", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return AuthenticatedUser(
        uid=uid,
        email=data.get("email"),
        nombres=data.get("nombres", ""),
        apellidos=data.get("apellidos", ""),
        telefono=data.get("telefono"),
        tipo=data.get("tipo", ""),
        conjunto_id=data.get("conjuntoId", ""),
        unidad=data.get("unidad"),
        torre=data.get("torre"),
        activo=bool(data.get("activo", False)),
    )
