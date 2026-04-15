from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import date
from fastapi import HTTPException, status

from app.models import Reserva
from app.models.habitacion import EstadoHabitacionEnum
from app.schemas.reserva import ReservaCreate
from app.crud.habitacion import get_habitacion_by_id
from app.crud.habitacion_popular import register_habitacion_reserva


def check_overlap(
    db: Session,
    habitacion_id: int,
    fecha_checkin: date,
    fecha_checkout: date
) -> bool:
    """
    Verifica si existe solapamiento de fechas para una habitación.
    Retorna True si hay solapamiento, False en caso contrario.
    """
    overlap_count = db.query(Reserva).filter(
        and_(
            Reserva.habitacion_id == habitacion_id,
            Reserva.estado.in_(["pendiente", "activo"]),
            ~((Reserva.fecha_checkout <= fecha_checkin) | (Reserva.fecha_checkin >= fecha_checkout))
        )
    ).count()
    
    return overlap_count > 0


def create_reserva(db: Session, reserva: ReservaCreate, usuario_id: int) -> Reserva:
    """
    Crea una nueva reserva después de verificar disponibilidad.
    Lanza HTTPException(400) si hay solapamiento de fechas.
    """
    # Verificar disponibilidad por rango de fechas
    if check_overlap(db, reserva.habitacion_id, reserva.fecha_checkin, reserva.fecha_checkout):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Habitación no disponible"
        )
    
    # Calcular total
    dias = (reserva.fecha_checkout - reserva.fecha_checkin).days
    
    # Obtener habitación y validar estado actual
    habitacion = get_habitacion_by_id(db, reserva.habitacion_id)
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )

    if habitacion.estado == EstadoHabitacionEnum.mantenimiento:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La habitación está en mantenimiento"
        )
    
    total = habitacion.precio_noche * dias
    
    db_reserva = Reserva(
        usuario_id=usuario_id,
        habitacion_id=reserva.habitacion_id,
        fecha_checkin=reserva.fecha_checkin,
        fecha_checkout=reserva.fecha_checkout,
        num_huespedes=reserva.num_huespedes,
        total=total,
        solicitudes_especiales=reserva.solicitudes_especiales
    )
    
    db.add(db_reserva)
    register_habitacion_reserva(db, reserva.habitacion_id)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva


def get_reserva_by_id(db: Session, reserva_id: int) -> Optional[Reserva]:
    """Obtiene una reserva por su ID."""
    return db.query(Reserva).filter(Reserva.id == reserva_id).first()


def get_user_reservas(
    db: Session,
    usuario_id: int,
    estados: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Reserva]:
    """Obtiene todas las reservas de un usuario."""
    query = db.query(Reserva).filter(Reserva.usuario_id == usuario_id)

    if estados:
        query = query.filter(Reserva.estado.in_(estados))

    return query.offset(skip).limit(limit).all()


def get_all_reservas(db: Session, skip: int = 0, limit: int = 100) -> List[Reserva]:
    """Obtiene todas las reservas."""
    return db.query(Reserva).offset(skip).limit(limit).all()


def get_habitacion_reservas_ocupadas(db: Session, habitacion_id: int) -> List[Reserva]:
    """Obtiene reservas que bloquean disponibilidad para una habitación."""
    return db.query(Reserva).filter(
        Reserva.habitacion_id == habitacion_id,
        Reserva.estado.in_(["pendiente", "activo"])
    ).all()


def update_reserva_estado(db: Session, reserva_id: int, nuevo_estado: str) -> Optional[Reserva]:
    """Actualiza el estado de una reserva."""
    db_reserva = get_reserva_by_id(db, reserva_id)
    if not db_reserva:
        return None
    
    db_reserva.estado = nuevo_estado
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva


def delete_reserva(db: Session, reserva_id: int) -> bool:
    """Elimina una reserva."""
    db_reserva = get_reserva_by_id(db, reserva_id)
    if not db_reserva:
        return False
    
    db.delete(db_reserva)
    db.commit()
    return True
