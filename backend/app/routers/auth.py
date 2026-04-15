from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import json
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

from app.database import get_db
from app.core.config import get_settings
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioResponse, TokenResponse, UsuarioSelfUpdate
from app.crud.usuario import create_user, get_user_by_dni, get_user_by_email
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user
from app.models import Usuario

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_full_name(payload: dict) -> str:
    full_name = payload.get("nombre_completo") or payload.get("name") or ""
    if full_name:
        return str(full_name).strip()

    nombres = payload.get("nombres") or payload.get("nombre") or ""
    apellido_paterno = payload.get("apellido_paterno") or payload.get("apellidoPaterno") or ""
    apellido_materno = payload.get("apellido_materno") or payload.get("apellidoMaterno") or ""
    combined = f"{nombres} {apellido_paterno} {apellido_materno}".strip()
    return " ".join(combined.split())


def _extract_data(raw: dict) -> dict:
    if isinstance(raw.get("data"), dict):
        return raw["data"]
    if isinstance(raw.get("resultado"), dict):
        return raw["resultado"]
    return raw


def _fetch_dni_from_apiperu(dni: str) -> str:
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.apiperu_token}",
        "Content-Type": "application/json",
    }

    payload = json.dumps({"dni": dni}).encode("utf-8")
    req = urlrequest.Request(settings.apiperu_url_dni, data=payload, headers=headers, method="POST")

    try:
        with urlrequest.urlopen(req, timeout=12) as response:
            body = response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore") if hasattr(exc, "read") else ""
        raise HTTPException(status_code=502, detail=f"Error consultando DNI: {detail or str(exc)}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail="No se pudo conectar con el servicio de DNI") from exc

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Respuesta inválida del servicio de DNI") from exc

    data = _extract_data(parsed)
    full_name = _build_full_name(data)
    if not full_name:
        raise HTTPException(status_code=404, detail="No se encontró información para ese DNI")
    return full_name


@router.get("/dni/{dni}")
def consultar_dni(dni: str):
    """Consulta DNI en API Peru Dev y devuelve nombre completo normalizado."""
    dni = dni.strip()
    if not dni.isdigit() or len(dni) != 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="DNI inválido")

    nombre = _fetch_dni_from_apiperu(dni)
    return {"dni": dni, "nombre": nombre}


@router.post("/register", response_model=UsuarioResponse)
def register(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario con rol 'huesped'.
    """
    # Verificar que el email no exista
    normalized_email = usuario.email.strip().lower()
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    normalized_dni = usuario.dni.strip()
    if not normalized_dni.isdigit() or len(normalized_dni) != 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI debe tener 8 dígitos"
        )

    existing_user_by_dni = get_user_by_dni(db, normalized_dni)
    if existing_user_by_dni:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI ya está registrado"
        )

    # Crear usuario
    usuario_data = UsuarioCreate(
        dni=normalized_dni,
        nombre=usuario.nombre.strip(),
        email=normalized_email,
        password=usuario.password,
    )
    new_user = create_user(db, usuario_data)
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(credentials: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Autentica un usuario y retorna un JWT token.
    """
    # Buscar usuario por email
    normalized_email = credentials.email.strip().lower()
    user = get_user_by_email(db, normalized_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Verificar contraseña
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Crear token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": normalized_email,
            "rol": user.rol.value
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UsuarioResponse.model_validate(user)
    }


@router.get("/me", response_model=UsuarioResponse)
def get_me(current_user: Usuario = Depends(get_current_user)):
    """
    Retorna el usuario actual autenticado.
    """
    return current_user


@router.put("/me", response_model=UsuarioResponse)
def update_me(
    payload: UsuarioSelfUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualiza perfil del usuario autenticado."""
    if payload.dni is not None:
        normalized_dni = payload.dni.strip()
        if not normalized_dni.isdigit() or len(normalized_dni) != 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El DNI debe tener 8 dígitos")

        existing_dni_user = get_user_by_dni(db, normalized_dni)
        if existing_dni_user and existing_dni_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El DNI ya está registrado")
        current_user.dni = normalized_dni

    if payload.email is not None:
        normalized_email = payload.email.strip().lower()
        existing_email_user = get_user_by_email(db, normalized_email)
        if existing_email_user and existing_email_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
        current_user.email = normalized_email

    if payload.nombre is not None:
        current_user.nombre = payload.nombre.strip()

    if payload.new_password is not None:
        if not payload.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes ingresar tu contraseña actual para cambiarla"
            )

        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contraseña actual incorrecta")

        current_user.password_hash = hash_password(payload.new_password)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
