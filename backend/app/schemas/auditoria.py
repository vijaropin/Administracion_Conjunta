from typing import Any
from pydantic import BaseModel, ConfigDict


class AuditoriaLogEntry(BaseModel):
    entidad: str
    accion: str
    detalles: dict[str, Any]
    
    model_config = ConfigDict(extra="allow")
