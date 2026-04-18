from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class NotificacionResponse(BaseModel):
    id: int
    usuario_id: int
    mensaje: str
    leida: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class NotificacionUsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str

    class Config:
        from_attributes = True


class NotificacionAdminResponse(BaseModel):
    id: int
    usuario_id: int
    mensaje: str
    leida: bool
    fecha_creacion: datetime
    usuario: NotificacionUsuarioResponse

    class Config:
        from_attributes = True


class NotificacionSendRequest(BaseModel):
    destinatario: Literal["all", "single"] = "all"
    usuario_id: Optional[int] = None
    plantilla: Literal["custom", "salida_24h", "estadia_hoy", "pago_pendiente"] = "custom"
    mensaje: str = Field(min_length=1, max_length=500)


class NotificacionSendResponse(BaseModel):
    sent: int
    destinatario: Literal["all", "single"]
    plantilla: Literal["custom", "salida_24h", "estadia_hoy", "pago_pendiente"]
