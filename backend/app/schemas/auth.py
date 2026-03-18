from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    uid: str
    email: str | None = None
    nombres: str
    apellidos: str
    telefono: str | None = None
    tipo: str
    conjunto_id: str
    unidad: str | None = None
    torre: str | None = None
    activo: bool


class AuthenticatedUserResponse(BaseModel):
    user: AuthenticatedUser
