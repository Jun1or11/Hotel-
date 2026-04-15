from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from app.models import EstadoReservaEnum
from app.schemas.usuario import UsuarioResponse
from app.schemas.habitacion import HabitacionResponse


class ReservaCreate(BaseModel):
    """Schema para crear una reserva."""
    habitacion_id: int
    fecha_checkin: date
    fecha_checkout: date
    num_huespedes: int
    solicitudes_especiales: Optional[str] = None


class ReservaResponse(BaseModel):
    """Schema para retornar datos de reserva."""
    id: int
    usuario_id: int
    habitacion_id: int
    fecha_checkin: date
    fecha_checkout: date
    num_huespedes: int
    total: Decimal
    estado: EstadoReservaEnum
    solicitudes_especiales: Optional[str]
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class ReservaDetailResponse(BaseModel):
    """Schema para retornar reserva con relaciones."""
    id: int
    usuario: UsuarioResponse
    habitacion: HabitacionResponse
    fecha_checkin: date
    fecha_checkout: date
    num_huespedes: int
    total: Decimal
    estado: EstadoReservaEnum
    solicitudes_especiales: Optional[str]
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class ReservaUpdate(BaseModel):
    """Schema para actualizar reserva."""
    estado: Optional[EstadoReservaEnum] = None
    solicitudes_especiales: Optional[str] = None
