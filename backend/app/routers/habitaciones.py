from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List

from app.database import get_db
from app.schemas.habitacion import (
    HabitacionCreate,
    HabitacionOcupacionResponse,
    HabitacionResponse,
    HabitacionUpdate,
)
from app.crud.habitacion import (
    create_habitacion,
    get_habitacion_by_id,
    get_all_habitaciones,
    update_habitacion,
    delete_habitacion
)
from app.crud.reserva import check_overlap
from app.crud.reserva import get_habitacion_reservas_ocupadas
from app.core.dependencies import require_admin

router = APIRouter(prefix="/habitaciones", tags=["habitaciones"])


@router.get("", response_model=List[HabitacionResponse])
def list_habitaciones(
    db: Session = Depends(get_db),
    tipo: Optional[str] = Query(None),
    fecha_checkin: Optional[date] = Query(None),
    fecha_checkout: Optional[date] = Query(None),
    capacidad: Optional[int] = Query(None)
):
    """
    Lista todas las habitaciones con filtros opcionales.
    Si se proporcionan fechas, solo retorna habitaciones disponibles.
    """
    habitaciones = get_all_habitaciones(db, tipo=tipo)
    
    # Filtrar por capacidad si se proporciona
    if capacidad:
        habitaciones = [h for h in habitaciones if h.capacidad >= capacidad]
    
    # Filtrar por disponibilidad en fechas si se proporcionan
    if fecha_checkin and fecha_checkout:
        habitaciones = [
            h for h in habitaciones
            if not check_overlap(db, h.id, fecha_checkin, fecha_checkout)
        ]
    
    return habitaciones


@router.get("/{habitacion_id}", response_model=HabitacionResponse)
def get_habitacion(habitacion_id: int, db: Session = Depends(get_db)):
    """
    Obtiene los detalles de una habitación específica.
    """
    habitacion = get_habitacion_by_id(db, habitacion_id)
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    return habitacion


@router.get("/{habitacion_id}/ocupacion", response_model=List[HabitacionOcupacionResponse])
def get_habitacion_ocupacion(habitacion_id: int, db: Session = Depends(get_db)):
    """Obtiene rangos de fechas ocupadas para una habitación."""
    habitacion = get_habitacion_by_id(db, habitacion_id)
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )

    reservas = get_habitacion_reservas_ocupadas(db, habitacion_id)
    return [
        {
            "fecha_checkin": reserva.fecha_checkin,
            "fecha_checkout": reserva.fecha_checkout,
        }
        for reserva in reservas
    ]


@router.post("", response_model=HabitacionResponse)
def create_new_habitacion(
    habitacion: HabitacionCreate,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Crea una nueva habitación (solo administrador).
    """
    return create_habitacion(db, habitacion)


@router.put("/{habitacion_id}", response_model=HabitacionResponse)
def update_habitacion_endpoint(
    habitacion_id: int,
    habitacion_update: HabitacionUpdate,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Actualiza una habitación existente (solo administrador).
    """
    habitacion = update_habitacion(db, habitacion_id, habitacion_update)
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    return habitacion


@router.delete("/{habitacion_id}")
def delete_habitacion_endpoint(
    habitacion_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Elimina una habitación (solo administrador).
    """
    if not delete_habitacion(db, habitacion_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )
    return {"message": "Habitación eliminada"}
