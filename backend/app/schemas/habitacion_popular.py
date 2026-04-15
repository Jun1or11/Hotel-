from pydantic import BaseModel

from app.models import TipoEnum


class HabitacionPopularResponse(BaseModel):
    habitacion_id: int
    numero: str
    tipo: TipoEnum
    total_reservas: int
