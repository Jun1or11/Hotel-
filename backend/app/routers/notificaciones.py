from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.notificacion import (
    clear_user_notificaciones,
    get_all_notificaciones,
    get_notificacion_by_id,
    get_user_notificaciones,
    mark_all_as_read,
    mark_notificacion_as_read,
)
from app.database import get_db
from app.core.dependencies import require_admin
from app.models import Usuario
from app.schemas.notificacion import NotificacionAdminResponse, NotificacionResponse

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("/enviadas", response_model=List[NotificacionAdminResponse])
def list_enviadas_admin(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
    skip: int = 0,
    limit: int = 100,
):
    return get_all_notificaciones(db, skip=skip, limit=limit)


@router.get("/mis-notificaciones", response_model=List[NotificacionResponse])
def list_my_notificaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
):
    return get_user_notificaciones(db, usuario_id=current_user.id, skip=skip, limit=limit)


@router.put("/{notificacion_id}/leer", response_model=NotificacionResponse)
def read_notificacion(
    notificacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    notificacion = get_notificacion_by_id(db, notificacion_id=notificacion_id)
    if not notificacion or notificacion.usuario_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificacion no encontrada")

    updated = mark_notificacion_as_read(db, notificacion_id=notificacion_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificacion no encontrada")
    return updated


@router.put("/leer-todas")
def read_all_notificaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    updated = mark_all_as_read(db, usuario_id=current_user.id)
    return {"updated": updated}


@router.delete("/limpiar")
def clear_notificaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    deleted = clear_user_notificaciones(db, usuario_id=current_user.id)
    return {"deleted": deleted}
