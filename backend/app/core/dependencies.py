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
