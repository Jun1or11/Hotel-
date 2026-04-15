from sqlalchemy.orm import Session
from typing import Optional, List
from sqlalchemy import func

from app.models import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.core.security import hash_password


def create_user(db: Session, usuario: UsuarioCreate) -> Usuario:
    """Crea un nuevo usuario en la base de datos."""
    hashed_password = hash_password(usuario.password)
    normalized_email = usuario.email.strip().lower()
    
    db_usuario = Usuario(
        dni=usuario.dni,
        nombre=usuario.nombre,
        email=normalized_email,
        password_hash=hashed_password,
        rol="huesped"
    )
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


def get_user_by_email(db: Session, email: str) -> Optional[Usuario]:
    """Obtiene un usuario por su email."""
    normalized_email = email.strip().lower()
    return db.query(Usuario).filter(func.lower(Usuario.email) == normalized_email).first()


def get_user_by_dni(db: Session, dni: str) -> Optional[Usuario]:
    """Obtiene un usuario por DNI."""
    return db.query(Usuario).filter(Usuario.dni == dni.strip()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[Usuario]:
    """Obtiene un usuario por su ID."""
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[Usuario]:
    """Obtiene todos los usuarios con paginación."""
    return db.query(Usuario).offset(skip).limit(limit).all()


def update_user(db: Session, user_id: int, usuario_update: UsuarioUpdate) -> Optional[Usuario]:
    """Actualiza un usuario existente."""
    db_usuario = get_user_by_id(db, user_id)
    if not db_usuario:
        return None
    
    update_data = usuario_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_usuario, field, value)
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


def delete_user(db: Session, user_id: int) -> bool:
    """Elimina un usuario."""
    db_usuario = get_user_by_id(db, user_id)
    if not db_usuario:
        return False
    
    db.delete(db_usuario)
    db.commit()
    return True
