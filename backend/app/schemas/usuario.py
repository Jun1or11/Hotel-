import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional

from app.models import RolEnum


def _ensure_gmail_domain(email: str) -> str:
    normalized_email = email.strip().lower()
    if not normalized_email.endswith('@gmail.com'):
        raise ValueError('Solo se permiten correos @gmail.com')
    return normalized_email


def _ensure_password_policy(password: str) -> str:
    """
    Validación de contraseña.
    Requisitos:
    - Entre 7 y 12 caracteres
    - Al menos 1 mayúscula
    - Al menos 1 número
    - Solo letras y números (sin símbolos especiales)
    """
    if len(password) < 7 or len(password) > 12:
        raise ValueError('La contraseña debe tener entre 7 y 12 caracteres')

    if not any(char.isupper() for char in password):
        raise ValueError('Debe contener al menos una mayúscula (A-Z)')

    if not any(char.isdigit() for char in password):
        raise ValueError('Debe contener al menos un número (0-9)')

    return password


class UsuarioCreate(BaseModel):
    """Schema para crear un usuario (registro)."""
    dni: str = Field(min_length=8, max_length=8)
    nombre: str | None = None
    email: EmailStr
    password: str

    @field_validator('dni')
    @classmethod
    def strip_dni(cls, value: str) -> str:
        return value.strip()

    @field_validator('nombre', mode='before')
    @classmethod
    def normalize_nombre(cls, value: str | None) -> str | None:
        if value is None or value.strip() == '':
            return None
        return value.strip()

    @field_validator('email')
    @classmethod
    def validate_gmail_email(cls, value: EmailStr) -> str:
        return _ensure_gmail_domain(str(value))

    @field_validator('password')
    @classmethod
    def validate_password_policy(cls, value: str) -> str:
        return _ensure_password_policy(value)


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

    model_config = ConfigDict(from_attributes=True)


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
    new_password: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_gmail_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        if value is None:
            return value
        return _ensure_gmail_domain(str(value))

    @field_validator('new_password')
    @classmethod
    def validate_password_policy(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _ensure_password_policy(value)


class TokenResponse(BaseModel):
    """Schema para respuesta de login."""
    access_token: str
    token_type: str
    user: UsuarioResponse
