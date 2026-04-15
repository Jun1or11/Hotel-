from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class EstadoPagoEnum(str, PyEnum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"
    reembolsado = "reembolsado"


class MetodoPagoEnum(str, PyEnum):
    efectivo = "efectivo"
    tarjeta = "tarjeta"
    transferencia = "transferencia"
    mercadopago = "mercadopago"


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id"), nullable=False, index=True)
    monto = Column(Numeric(10, 2), nullable=False)
    moneda = Column(String(8), nullable=False, default="USD")
    metodo = Column(Enum(MetodoPagoEnum), nullable=False, default=MetodoPagoEnum.mercadopago)
    estado = Column(Enum(EstadoPagoEnum), nullable=False, default=EstadoPagoEnum.pendiente)
    referencia_externa = Column(String(120), nullable=True)
    fecha_pago = Column(DateTime, default=datetime.utcnow, nullable=False)

    reserva = relationship("Reserva", back_populates="pagos")

    def __repr__(self):
        return f"<Pago {self.id} - Reserva {self.reserva_id}>"
