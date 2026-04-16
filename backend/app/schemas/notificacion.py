from datetime import datetime

from pydantic import BaseModel


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
