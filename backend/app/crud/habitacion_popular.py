from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Habitacion, HabitacionPopular


def register_habitacion_reserva(db: Session, habitacion_id: int) -> HabitacionPopular:
    db_habitacion_popular = (
        db.query(HabitacionPopular)
        .filter(HabitacionPopular.habitacion_id == habitacion_id)
        .first()
    )

    if not db_habitacion_popular:
        db_habitacion_popular = HabitacionPopular(
            habitacion_id=habitacion_id,
            total_reservas=1,
            fecha_ultima_reserva=datetime.utcnow(),
        )
        db.add(db_habitacion_popular)
        return db_habitacion_popular

    db_habitacion_popular.total_reservas += 1
    db_habitacion_popular.fecha_ultima_reserva = datetime.utcnow()
    db.add(db_habitacion_popular)
    return db_habitacion_popular


def get_top_habitaciones_populares(db: Session, limit: int = 5) -> list[dict]:
    rows = (
        db.query(HabitacionPopular, Habitacion)
        .join(Habitacion, Habitacion.id == HabitacionPopular.habitacion_id)
        .order_by(HabitacionPopular.total_reservas.desc(), HabitacionPopular.fecha_ultima_reserva.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "habitacion_id": habitacion.id,
            "numero": habitacion.numero,
            "tipo": habitacion.tipo,
            "total_reservas": popular.total_reservas,
        }
        for popular, habitacion in rows
    ]
