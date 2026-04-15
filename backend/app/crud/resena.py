from sqlalchemy.orm import Session

from app.models import Resena


def get_resena_by_usuario_id(db: Session, usuario_id: int) -> Resena | None:
    return db.query(Resena).filter(Resena.usuario_id == usuario_id).first()


def upsert_resena(
    db: Session,
    usuario_id: int,
    puntuacion: int,
    comentario: str | None,
) -> Resena:
    existing_resena = get_resena_by_usuario_id(db, usuario_id)

    clean_comment = comentario.strip() if comentario else None
    if clean_comment == "":
        clean_comment = None

    if existing_resena:
        existing_resena.puntuacion = puntuacion
        existing_resena.comentario = clean_comment
        db.add(existing_resena)
        db.commit()
        db.refresh(existing_resena)
        return existing_resena

    db_resena = Resena(
        usuario_id=usuario_id,
        puntuacion=puntuacion,
        comentario=clean_comment,
    )
    db.add(db_resena)
    db.commit()
    db.refresh(db_resena)
    return db_resena