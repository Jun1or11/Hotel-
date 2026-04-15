from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum

from app.database import Base


class TipoEnum(str, PyEnum):
    estandar = "estandar"
    familiar = "familiar"
    matrimonial = "matrimonial"
    suite = "suite"


class EstadoHabitacionEnum(str, PyEnum):
    libre = "libre"
    ocupado = "ocupado"
    mantenimiento = "mantenimiento"


class Habitacion(Base):
    __tablename__ = "habitaciones"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(10), unique=True, nullable=False, index=True)
    tipo = Column(Enum(TipoEnum), nullable=False)
    capacidad = Column(Integer, nullable=False)
    precio_noche = Column(Numeric(10, 2), nullable=False)
    estado = Column(Enum(EstadoHabitacionEnum), default=EstadoHabitacionEnum.libre, nullable=False)
    descripcion = Column(String(500), nullable=True)
    amenidades = Column(JSON, nullable=True, default=dict)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    reservas = relationship("Reserva", back_populates="habitacion")
    popularidad = relationship("HabitacionPopular", back_populates="habitacion", uselist=False)

    def __repr__(self):
        return f"<Habitacion {self.numero}>"
