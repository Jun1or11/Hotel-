from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Resena(Base):
    __tablename__ = "resenas"
    __table_args__ = (UniqueConstraint("usuario_id", name="uq_resenas_usuario_id"),)

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    puntuacion = Column(Integer, nullable=False)
    comentario = Column(String(500), nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario", back_populates="resena")

    def __repr__(self):
        return f"<Resena {self.id} - Usuario {self.usuario_id}>"