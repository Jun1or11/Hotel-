from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.core.security import verify_token
from app.models import Usuario
from app.crud.usuario import get_user_by_id

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Valida JWT token y retorna el Usuario actual.
    Lanza HTTPException(401) si el token es inválido o expirado.
    """
    token = credentials.credentials
    
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    user = get_user_by_id(db, user_id=int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    return user


def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Verifica que el usuario actual sea administrador.
    Lanza HTTPException(403) si no lo es.
    """
    if user.rol.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    return user


def verify_resource_access(
    resource_owner_id: int,
    current_user: Usuario,
    resource_name: str = "recurso"
) -> None:
    """
    ✅ A01 - Broken Access Control Mitigation
    Verifica que el usuario tenga acceso al recurso.
    Solo permite si es propietario o es admin.
    
    Args:
        resource_owner_id: ID del usuario propietario del recurso
        current_user: Usuario autenticado actual
        resource_name: Nombre del recurso (para mensaje de error)
    
    Raises:
        HTTPException(403) si no tiene permiso
    """
    is_owner = resource_owner_id == current_user.id
    is_admin = current_user.rol.value == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permiso para acceder a este {resource_name}"
        )
