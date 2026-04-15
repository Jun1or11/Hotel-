from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

from app.models import RolEnum


class UsuarioCreate(BaseModel):
    """Schema para crear un usuario (registro)."""
    dni: str = Field(min_length=8, max_length=8)
    nombre: str
    email: EmailStr
    password: str


class UsuarioLogin(BaseModel):
    """Schema para login."""
    email: EmailStr
    password: str


class UsuarioResponse(BaseModel):
    """Schema para retornar datos de usuario."""
    id: int
    dni: str | None = None
    nombre: str
    email: str
    rol: RolEnum
    activo: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True


class UsuarioUpdate(BaseModel):
    """Schema para actualizar usuario (admin only)."""
    dni: Optional[str] = Field(default=None, min_length=8, max_length=8)
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[RolEnum] = None
    activo: Optional[bool] = None


class UsuarioSelfUpdate(BaseModel):
    """Schema para actualizar perfil propio."""
    dni: Optional[str] = Field(default=None, min_length=8, max_length=8)
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=6)


class TokenResponse(BaseModel):
    """Schema para respuesta de login."""
    access_token: str
    token_type: str
    user: UsuarioResponse
