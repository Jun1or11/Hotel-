from typing import List, Optional

from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.models import Notificacion


def create_notificacion(db: Session, *, usuario_id: int, mensaje: str) -> Notificacion:
    notificacion = Notificacion(usuario_id=usuario_id, mensaje=mensaje, leida=False)
    db.add(notificacion)
    db.commit()
    db.refresh(notificacion)
    return notificacion


def create_notificaciones_bulk(db: Session, *, usuario_ids: List[int], mensaje: str) -> int:
    if not usuario_ids:
        return 0

    notificaciones = [
        Notificacion(usuario_id=usuario_id, mensaje=mensaje, leida=False)
        for usuario_id in usuario_ids
    ]
    db.add_all(notificaciones)
    db.commit()
    return len(notificaciones)


def get_user_notificaciones(db: Session, *, usuario_id: int, skip: int = 0, limit: int = 50) -> List[Notificacion]:
    return (
        db.query(Notificacion)
        .filter(Notificacion.usuario_id == usuario_id)
        .order_by(Notificacion.fecha_creacion.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_all_notificaciones(db: Session, *, skip: int = 0, limit: int = 100) -> List[Notificacion]:
    return (
        db.query(Notificacion)
        .options(joinedload(Notificacion.usuario))
        .order_by(Notificacion.fecha_creacion.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_notificacion_by_id(db: Session, *, notificacion_id: int) -> Optional[Notificacion]:
    return db.query(Notificacion).filter(Notificacion.id == notificacion_id).first()


def mark_notificacion_as_read(db: Session, *, notificacion_id: int) -> Optional[Notificacion]:
    notificacion = get_notificacion_by_id(db, notificacion_id=notificacion_id)
    if not notificacion:
        return None

    notificacion.leida = True
    db.add(notificacion)
    db.commit()
    db.refresh(notificacion)
    return notificacion


def mark_all_as_read(db: Session, *, usuario_id: int) -> int:
    updated = (
        db.query(Notificacion)
        .filter(Notificacion.usuario_id == usuario_id, Notificacion.leida.is_(False))
        .update({Notificacion.leida: True}, synchronize_session=False)
    )
    db.commit()
    return updated


def clear_user_notificaciones(db: Session, *, usuario_id: int) -> int:
    deleted = db.query(Notificacion).filter(Notificacion.usuario_id == usuario_id).delete(synchronize_session=False)
    db.commit()
    return deleted
