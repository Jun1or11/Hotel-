from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class HabitacionPopular(Base):
    __tablename__ = "habitaciones_populares"
    __table_args__ = (UniqueConstraint("habitacion_id", name="uq_habitaciones_populares_habitacion_id"),)

    id = Column(Integer, primary_key=True, index=True)
    habitacion_id = Column(Integer, ForeignKey("habitaciones.id"), nullable=False, index=True)
    total_reservas = Column(Integer, nullable=False, default=0)
    fecha_ultima_reserva = Column(DateTime, nullable=False, default=datetime.utcnow)

    habitacion = relationship("Habitacion", back_populates="popularidad")

    def __repr__(self):
        return f"<HabitacionPopular habitacion={self.habitacion_id} total={self.total_reservas}>"