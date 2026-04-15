# Centralizar imports de schemas
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioResponse, UsuarioUpdate, TokenResponse
from app.schemas.habitacion import HabitacionCreate, HabitacionResponse, HabitacionUpdate
from app.schemas.reserva import ReservaCreate, ReservaResponse, ReservaDetailResponse, ReservaUpdate
from app.schemas.pago import PagoCreate, PagoResponse

__all__ = [
    # Usuario
    "UsuarioCreate",
    "UsuarioLogin",
    "UsuarioResponse",
    "UsuarioUpdate",
    "TokenResponse",
    # Habitacion
    "HabitacionCreate",
    "HabitacionResponse",
    "HabitacionUpdate",
    # Reserva
    "ReservaCreate",
    "ReservaResponse",
    "ReservaDetailResponse",
    "ReservaUpdate",
    # Pago
    "PagoCreate",
    "PagoResponse",
]
