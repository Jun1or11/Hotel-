from sqlalchemy.orm import Session
from typing import Optional, List

from app.models import Habitacion
from app.schemas.habitacion import HabitacionCreate, HabitacionUpdate


def create_habitacion(db: Session, habitacion: HabitacionCreate) -> Habitacion:
    """Crea una nueva habitación."""
    db_habitacion = Habitacion(
        numero=habitacion.numero,
        tipo=habitacion.tipo,
        capacidad=habitacion.capacidad,
        precio_noche=habitacion.precio_noche,
        estado=habitacion.estado,
        descripcion=habitacion.descripcion,
        amenidades=habitacion.amenidades
    )
    
    db.add(db_habitacion)
    db.commit()
    db.refresh(db_habitacion)
    return db_habitacion


def get_habitacion_by_id(db: Session, hab_id: int) -> Optional[Habitacion]:
    """Obtiene una habitación por su ID."""
    return db.query(Habitacion).filter(Habitacion.id == hab_id).first()


def get_all_habitaciones(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    tipo: Optional[str] = None
) -> List[Habitacion]:
    """Obtiene todas las habitaciones con filtros opcionales."""
    query = db.query(Habitacion)
    
    if tipo:
        query = query.filter(Habitacion.tipo == tipo)
    
    return query.offset(skip).limit(limit).all()


def update_habitacion(
    db: Session,
    hab_id: int,
    habitacion_update: HabitacionUpdate
) -> Optional[Habitacion]:
    """Actualiza una habitación existente."""
    db_habitacion = get_habitacion_by_id(db, hab_id)
    if not db_habitacion:
        return None
    
    update_data = habitacion_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_habitacion, field, value)
    
    db.add(db_habitacion)
    db.commit()
    db.refresh(db_habitacion)
    return db_habitacion


def delete_habitacion(db: Session, hab_id: int) -> bool:
    """Elimina una habitación."""
    db_habitacion = get_habitacion_by_id(db, hab_id)
    if not db_habitacion:
        return False
    
    db.delete(db_habitacion)
    db.commit()
    return True
