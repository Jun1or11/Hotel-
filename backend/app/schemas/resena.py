from datetime import datetime

from pydantic import BaseModel, Field


class ResenaUpsert(BaseModel):
    puntuacion: int = Field(ge=1, le=5)
    comentario: str | None = Field(default=None, max_length=500)


class ResenaResponse(BaseModel):
    id: int
    usuario_id: int
    puntuacion: int
    comentario: str | None = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class ResenaDashboardItem(BaseModel):
    id: int
    usuario_nombre: str
    puntuacion: int
    comentario: str | None = None
    fecha_creacion: datetime


class ResenaDashboardResponse(BaseModel):
    promedio_puntuacion: float
    total_resenas: int
    recientes: list[ResenaDashboardItem]