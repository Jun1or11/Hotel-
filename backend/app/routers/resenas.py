from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.resena import get_resena_by_usuario_id, upsert_resena
from app.database import get_db
from app.models import Usuario
from app.schemas.resena import ResenaResponse, ResenaUpsert

router = APIRouter(prefix="/resenas", tags=["resenas"])


@router.get("/mi-resena", response_model=ResenaResponse)
def get_mi_resena(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_resena = get_resena_by_usuario_id(db, current_user.id)
    if not db_resena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes reseña registrada",
        )
    return db_resena


@router.post("", response_model=ResenaResponse)
def create_or_update_resena(
    payload: ResenaUpsert,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return upsert_resena(
        db=db,
        usuario_id=current_user.id,
        puntuacion=payload.puntuacion,
        comentario=payload.comentario,
    )