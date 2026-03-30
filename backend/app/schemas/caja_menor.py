from datetime import datetime
from pydantic import BaseModel, Field


class CajaMenorCreateRequest(BaseModel):
    monto_aprobado: float = Field(..., alias="montoAprobado", gt=0)
    fecha_aprobacion: datetime = Field(..., alias="fechaAprobacion")
    observaciones: str | None = None


class GastoCajaMenorRequest(BaseModel):
    concepto: str
    valor: float = Field(..., gt=0)
    fecha_gasto: datetime = Field(..., alias="fechaGasto")
    soporte_nombre: str | None = Field(default=None, alias="soporteNombre")
    soporte_url: str | None = Field(default=None, alias="soporteUrl")


class CajaMenorCloseRequest(BaseModel):
    # En caso de necesitar futuras justificaciones al cierre.
    pass
