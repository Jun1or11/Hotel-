from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.notificacion import (
    clear_user_notificaciones,
    create_notificacion,
    create_notificaciones_bulk,
    get_all_notificaciones,
    get_notificacion_by_id,
    get_user_notificaciones,
    mark_all_as_read,
    mark_notificacion_as_read,
)
from app.database import get_db
from app.core.dependencies import require_admin
from app.crud.usuario import get_all_users, get_user_by_id
from app.models import Usuario
from app.schemas.notificacion import (
    NotificacionAdminResponse,
    NotificacionResponse,
    NotificacionSendRequest,
    NotificacionSendResponse,
)

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


def _build_notification_message(payload: NotificacionSendRequest) -> str:
    if payload.plantilla == "salida_24h":
        return payload.mensaje.strip() or "Te quedan 24 horas para tu salida."
    if payload.plantilla == "estadia_hoy":
        return payload.mensaje.strip() or "Tu estadía finaliza hoy. Por favor, coordina tu salida."
    if payload.plantilla == "pago_pendiente":
        return payload.mensaje.strip() or "Tienes un pago pendiente por confirmar."
    return payload.mensaje.strip()


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


@router.post("/enviar", response_model=NotificacionSendResponse)
def send_notificacion_admin(
    payload: NotificacionSendRequest,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    mensaje = _build_notification_message(payload)

    if payload.destinatario == "single":
        if payload.usuario_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debes indicar usuario_id")
        usuario = get_user_by_id(db, payload.usuario_id)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        create_notificacion(db, usuario_id=usuario.id, mensaje=mensaje)
        return {"sent": 1, "destinatario": payload.destinatario, "plantilla": payload.plantilla}

    usuarios = get_all_users(db, skip=0, limit=1000)
    active_ids = [usuario.id for usuario in usuarios if usuario.activo]
    sent = create_notificaciones_bulk(db, usuario_ids=active_ids, mensaje=mensaje)
    return {"sent": sent, "destinatario": payload.destinatario, "plantilla": payload.plantilla}
