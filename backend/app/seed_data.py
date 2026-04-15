"""
seed_data.py - Carga datos iniciales de manera idempotente.

Uso:
  python app/seed_data.py
    python -m app.seed_data

Qué crea/actualiza:
- 1 usuario administrador por defecto
- 3 usuarios huesped de prueba
- 16 habitaciones de prueba (4 por tipo)
"""

import os
import sys
from decimal import Decimal

if __package__ in (None, ""):
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.security import hash_password
from app.database import SessionLocal, init_db
from app.models import (
    EstadoHabitacionEnum,
    Habitacion,
    RolEnum,
    TipoEnum,
    Usuario,
)

ADMIN_EMAIL = "admin1@hotelnova.com"
ADMIN_PASSWORD = "Promocion135"

SEED_USERS = [
    {
        "nombre": "Ana Torres",
        "email": "ana@hotelnova.com",
        "password": "Ana12345",
        "rol": RolEnum.huesped,
    },
    {
        "nombre": "Luis Perez",
        "email": "luis@hotelnova.com",
        "password": "Luis12345",
        "rol": RolEnum.huesped,
    },
    {
        "nombre": "Maria Gomez",
        "email": "maria@hotelnova.com",
        "password": "Maria12345",
        "rol": RolEnum.huesped,
    },
]

SEED_ROOMS = [
    {
        "numero": "101",
        "tipo": TipoEnum.estandar,
        "capacidad": 1,
        "precio_noche": Decimal("80.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion estandar basica para una persona",
        "amenidades": {"wifi": True, "tv": True, "bano": True},
    },
    {
        "numero": "102",
        "tipo": TipoEnum.estandar,
        "capacidad": 2,
        "precio_noche": Decimal("90.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion estandar con cama doble",
        "amenidades": {"wifi": True, "tv": True, "bano": True},
    },
    {
        "numero": "103",
        "tipo": TipoEnum.estandar,
        "capacidad": 2,
        "precio_noche": Decimal("95.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion estandar mejorada con ventilacion",
        "amenidades": {"wifi": True, "tv": True, "ventilador": True},
    },
    {
        "numero": "104",
        "tipo": TipoEnum.estandar,
        "capacidad": 2,
        "precio_noche": Decimal("105.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion estandar con escritorio de trabajo",
        "amenidades": {"wifi": True, "tv": True, "escritorio": True},
    },
    {
        "numero": "201",
        "tipo": TipoEnum.matrimonial,
        "capacidad": 2,
        "precio_noche": Decimal("110.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion matrimonial basica con cama doble",
        "amenidades": {"wifi": True, "tv": True, "cama_doble": True},
    },
    {
        "numero": "202",
        "tipo": TipoEnum.matrimonial,
        "capacidad": 2,
        "precio_noche": Decimal("120.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion matrimonial con aire acondicionado",
        "amenidades": {"wifi": True, "tv": True, "aire_acondicionado": True},
    },
    {
        "numero": "203",
        "tipo": TipoEnum.matrimonial,
        "capacidad": 2,
        "precio_noche": Decimal("130.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion matrimonial con balcon",
        "amenidades": {"wifi": True, "tv": True, "balcon": True},
    },
    {
        "numero": "204",
        "tipo": TipoEnum.matrimonial,
        "capacidad": 2,
        "precio_noche": Decimal("140.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion matrimonial superior con escritorio",
        "amenidades": {"wifi": True, "tv": True, "aire_acondicionado": True, "escritorio": True},
    },
    {
        "numero": "301",
        "tipo": TipoEnum.familiar,
        "capacidad": 3,
        "precio_noche": Decimal("150.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion familiar basica con varias camas",
        "amenidades": {"wifi": True, "tv": True},
    },
    {
        "numero": "302",
        "tipo": TipoEnum.familiar,
        "capacidad": 4,
        "precio_noche": Decimal("170.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion familiar amplia",
        "amenidades": {"wifi": True, "tv": True, "aire_acondicionado": True},
    },
    {
        "numero": "303",
        "tipo": TipoEnum.familiar,
        "capacidad": 5,
        "precio_noche": Decimal("200.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion familiar con frigobar",
        "amenidades": {"wifi": True, "tv": True, "frigobar": True},
    },
    {
        "numero": "304",
        "tipo": TipoEnum.familiar,
        "capacidad": 6,
        "precio_noche": Decimal("220.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Habitacion familiar plus con microondas",
        "amenidades": {"wifi": True, "tv": True, "microondas": True, "aire_acondicionado": True},
    },
    {
        "numero": "401",
        "tipo": TipoEnum.suite,
        "capacidad": 2,
        "precio_noche": Decimal("300.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Suite ejecutiva con sala privada",
        "amenidades": {
            "wifi": True,
            "tv": True,
            "sala": True,
        },
    },
    {
        "numero": "402",
        "tipo": TipoEnum.suite,
        "capacidad": 3,
        "precio_noche": Decimal("350.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Suite con jacuzzi",
        "amenidades": {
            "wifi": True,
            "tv": True,
            "jacuzzi": True,
        },
    },
    {
        "numero": "403",
        "tipo": TipoEnum.suite,
        "capacidad": 4,
        "precio_noche": Decimal("420.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Suite premium con sala y comedor",
        "amenidades": {
            "wifi": True,
            "tv": True,
            "sala": True,
            "comedor": True,
        },
    },
    {
        "numero": "404",
        "tipo": TipoEnum.suite,
        "capacidad": 5,
        "precio_noche": Decimal("500.00"),
        "estado": EstadoHabitacionEnum.libre,
        "descripcion": "Suite presidencial de lujo",
        "amenidades": {
            "wifi": True,
            "tv": True,
            "jacuzzi": True,
            "sala": True,
            "comedor": True,
        },
    },
]


def upsert_user(db, *, nombre: str, email: str, password: str, rol: RolEnum) -> tuple[str, Usuario]:
    normalized_email = email.strip().lower()
    existing = db.query(Usuario).filter(Usuario.email == normalized_email).first()

    if existing:
        existing.nombre = nombre
        existing.password_hash = hash_password(password)
        existing.rol = rol
        existing.activo = True
        db.add(existing)
        return "updated", existing

    user = Usuario(
        nombre=nombre,
        email=normalized_email,
        password_hash=hash_password(password),
        rol=rol,
        activo=True,
    )
    db.add(user)
    return "created", user


def upsert_room(db, room_data: dict) -> str:
    existing = db.query(Habitacion).filter(Habitacion.numero == room_data["numero"]).first()

    if existing:
        existing.tipo = room_data["tipo"]
        existing.capacidad = room_data["capacidad"]
        existing.precio_noche = room_data["precio_noche"]
        existing.estado = room_data["estado"]
        existing.descripcion = room_data["descripcion"]
        existing.amenidades = room_data["amenidades"]
        db.add(existing)
        return "updated"

    db.add(Habitacion(**room_data))
    return "created"


def seed_data() -> None:
    settings = get_settings()
    print(f"Using database: {settings.db_name} at {settings.db_host}:{settings.db_port}")

    init_db()
    db = SessionLocal()

    user_created = 0
    user_updated = 0
    room_created = 0
    room_updated = 0

    try:
        # Admin
        action, _ = upsert_user(
            db,
            nombre="Administrador",
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            rol=RolEnum.admin,
        )
        if action == "created":
            user_created += 1
        else:
            user_updated += 1

        # Huespedes de prueba
        for user in SEED_USERS:
            action, _ = upsert_user(db, **user)
            if action == "created":
                user_created += 1
            else:
                user_updated += 1

        # Habitaciones de prueba
        for room in SEED_ROOMS:
            action = upsert_room(db, room)
            if action == "created":
                room_created += 1
            else:
                room_updated += 1

        db.commit()

        print("\nSeed completado correctamente:")
        print(f"- Usuarios creados: {user_created}")
        print(f"- Usuarios actualizados: {user_updated}")
        print(f"- Habitaciones creadas: {room_created}")
        print(f"- Habitaciones actualizadas: {room_updated}")
        print("\nCredenciales admin:")
        print(f"- Email: {ADMIN_EMAIL}")
        print(f"- Password: {ADMIN_PASSWORD}")

    except Exception as exc:
        db.rollback()
        print(f"Error al ejecutar seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
