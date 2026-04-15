from sqlalchemy import Column, Integer, Date, DateTime, Numeric, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum

from app.database import Base


class EstadoReservaEnum(str, PyEnum):
    pendiente = "pendiente"
    activo = "activo"
    completado = "completado"
    cancelado = "cancelado"


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    habitacion_id = Column(Integer, ForeignKey("habitaciones.id"), nullable=False, index=True)
    fecha_checkin = Column(Date, nullable=False)
    fecha_checkout = Column(Date, nullable=False)
    num_huespedes = Column(Integer, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    estado = Column(Enum(EstadoReservaEnum), default=EstadoReservaEnum.pendiente, nullable=False)
    solicitudes_especiales = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    usuario = relationship("Usuario", back_populates="reservas")
    habitacion = relationship("Habitacion", back_populates="reservas")
    pagos = relationship("Pago", back_populates="reserva", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Reserva {self.id} - Usuario {self.usuario_id}>"
