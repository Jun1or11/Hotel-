from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from app.models import TipoEnum, EstadoHabitacionEnum


class HabitacionCreate(BaseModel):
    """Schema para crear una habitación."""
    numero: str
    tipo: TipoEnum
    capacidad: int
    precio_noche: Decimal
    estado: Optional[EstadoHabitacionEnum] = EstadoHabitacionEnum.libre
    descripcion: Optional[str] = None
    amenidades: Optional[dict] = None


class HabitacionResponse(BaseModel):
    """Schema para retornar datos de habitación."""
    id: int
    numero: str
    tipo: TipoEnum
    capacidad: int
    precio_noche: Decimal
    estado: EstadoHabitacionEnum
    descripcion: Optional[str]
    amenidades: Optional[dict]
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class HabitacionUpdate(BaseModel):
    """Schema para actualizar habitación."""
    numero: Optional[str] = None
    tipo: Optional[TipoEnum] = None
    capacidad: Optional[int] = None
    precio_noche: Optional[Decimal] = None
    estado: Optional[EstadoHabitacionEnum] = None
    descripcion: Optional[str] = None
    amenidades: Optional[dict] = None


class HabitacionOcupacionResponse(BaseModel):
    """Rango de fechas ocupadas para una habitación."""
    fecha_checkin: date
    fecha_checkout: date
