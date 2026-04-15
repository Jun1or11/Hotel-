from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate
from app.crud.usuario import (
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user
)
from app.core.dependencies import require_admin

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=List[UsuarioResponse])
def list_usuarios(
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
    skip: int = 0,
    limit: int = 100
):
    """
    Lista todos los usuarios (solo administrador).
    """
    return get_all_users(db, skip, limit)


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def get_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Obtiene los detalles de un usuario específico (solo administrador).
    """
    usuario = get_user_by_id(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def update_usuario_endpoint(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Actualiza un usuario (solo administrador).
    """
    usuario = update_user(db, usuario_id, usuario_update)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return usuario


@router.delete("/{usuario_id}")
def delete_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Elimina un usuario (solo administrador).
    """
    if not delete_user(db, usuario_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return {"message": "Usuario eliminado"}
