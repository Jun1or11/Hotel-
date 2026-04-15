from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum

from app.database import Base


class RolEnum(str, PyEnum):
    admin = "admin"
    huesped = "huesped"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String(8), unique=True, nullable=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(RolEnum), default=RolEnum.huesped, nullable=False)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    reservas = relationship("Reserva", back_populates="usuario")
    resena = relationship("Resena", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Usuario {self.email}>"
