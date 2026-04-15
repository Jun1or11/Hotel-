from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models import EstadoPagoEnum, MetodoPagoEnum


class PagoCreate(BaseModel):
    reserva_id: int
    monto: Decimal
    moneda: str = "USD"
    metodo: MetodoPagoEnum = MetodoPagoEnum.mercadopago
    estado: EstadoPagoEnum = EstadoPagoEnum.pendiente
    referencia_externa: Optional[str] = None


class PagoResponse(BaseModel):
    id: int
    reserva_id: int
    monto: Decimal
    moneda: str
    metodo: MetodoPagoEnum
    estado: EstadoPagoEnum
    referencia_externa: Optional[str]
    fecha_pago: datetime

    class Config:
        from_attributes = True
