from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional

from app.models import RolEnum


def _ensure_gmail_domain(email: str) -> str:
    normalized_email = email.strip().lower()
    if not normalized_email.endswith('@gmail.com'):
        raise ValueError('Solo se permiten correos @gmail.com')
    return normalized_email


class UsuarioCreate(BaseModel):
    """Schema para crear un usuario (registro)."""
    dni: str = Field(min_length=8, max_length=8)
    nombre: str
    email: EmailStr
    password: str

    @field_validator('email')
    @classmethod
    def validate_gmail_email(cls, value: EmailStr) -> str:
        return _ensure_gmail_domain(str(value))


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

    @field_validator('email')
    @classmethod
    def validate_gmail_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        if value is None:
            return value
        return _ensure_gmail_domain(str(value))


class UsuarioSelfUpdate(BaseModel):
    """Schema para actualizar perfil propio."""
    dni: Optional[str] = Field(default=None, min_length=8, max_length=8)
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=6)

    @field_validator('email')
    @classmethod
    def validate_gmail_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        if value is None:
            return value
        return _ensure_gmail_domain(str(value))


class TokenResponse(BaseModel):
    """Schema para respuesta de login."""
    access_token: str
    token_type: str
    user: UsuarioResponse
