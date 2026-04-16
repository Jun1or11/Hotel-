"""
seed_data.py - Carga datos iniciales de manera idempotente.

Uso:
  python app/seed_data.py
    python -m app.seed_data

Qué crea/actualiza:
- 1 usuario administrador por defecto
- 3 usuarios huesped de prueba
- 16 habitaciones de prueba (4 por tipo)
- 3 reservas de ejemplo ya pagadas
"""

import os
import sys
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func

if __package__ in (None, ""):
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.security import hash_password
from app.database import SessionLocal, init_db
from app.models import (
    EstadoHabitacionEnum,
    EstadoPagoEnum,
    EstadoReservaEnum,
    Habitacion,
    HabitacionPopular,
    MetodoPagoEnum,
    Pago,
    Reserva,
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

SEED_PAID_RESERVATIONS = [
    {
        "user_email": "ana@hotelnova.com",
        "room_number": "201",
        "checkin": date(2026, 3, 3),
        "checkout": date(2026, 3, 6),
        "num_huespedes": 2,
        "metodo": MetodoPagoEnum.tarjeta,
        "referencia": "SEED-ANA-201-20260303",
        "solicitudes": "Check-in temprano",
    },
    {
        "user_email": "luis@hotelnova.com",
        "room_number": "302",
        "checkin": date(2026, 2, 18),
        "checkout": date(2026, 2, 21),
        "num_huespedes": 3,
        "metodo": MetodoPagoEnum.transferencia,
        "referencia": "SEED-LUIS-302-20260218",
        "solicitudes": "Cuna adicional",
    },
    {
        "user_email": "maria@hotelnova.com",
        "room_number": "401",
        "checkin": date(2026, 1, 11),
        "checkout": date(2026, 1, 13),
        "num_huespedes": 2,
        "metodo": MetodoPagoEnum.mercadopago,
        "referencia": "SEED-MARIA-401-20260111",
        "solicitudes": "Vista exterior",
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


def upsert_paid_reservation(db, reservation_data: dict) -> str:
    user_email = reservation_data["user_email"].strip().lower()
    room_number = reservation_data["room_number"]

    user = db.query(Usuario).filter(Usuario.email == user_email).first()
    if not user:
        raise ValueError(f"Usuario no encontrado para seed: {user_email}")

    room = db.query(Habitacion).filter(Habitacion.numero == room_number).first()
    if not room:
        raise ValueError(f"Habitacion no encontrada para seed: {room_number}")

    nights = (reservation_data["checkout"] - reservation_data["checkin"]).days
    if nights <= 0:
        raise ValueError(
            f"Rango de fechas invalido en seed para {user_email} y habitacion {room_number}"
        )

    total = room.precio_noche * nights

    reserva = (
        db.query(Reserva)
        .filter(
            Reserva.usuario_id == user.id,
            Reserva.habitacion_id == room.id,
            Reserva.fecha_checkin == reservation_data["checkin"],
            Reserva.fecha_checkout == reservation_data["checkout"],
        )
        .first()
    )

    action = "updated"
    if not reserva:
        reserva = Reserva(
            usuario_id=user.id,
            habitacion_id=room.id,
            fecha_checkin=reservation_data["checkin"],
            fecha_checkout=reservation_data["checkout"],
            num_huespedes=reservation_data["num_huespedes"],
            total=total,
            estado=EstadoReservaEnum.activo,
            solicitudes_especiales=reservation_data.get("solicitudes"),
        )
        db.add(reserva)
        db.flush()
        action = "created"
    else:
        reserva.num_huespedes = reservation_data["num_huespedes"]
        reserva.total = total
        reserva.estado = EstadoReservaEnum.activo
        reserva.solicitudes_especiales = reservation_data.get("solicitudes")
        db.add(reserva)

    pago = db.query(Pago).filter(Pago.referencia_externa == reservation_data["referencia"]).first()
    if not pago:
        pago = db.query(Pago).filter(Pago.reserva_id == reserva.id).first()

    if pago:
        pago.reserva_id = reserva.id
        pago.monto = total
        pago.moneda = "PEN"
        pago.metodo = reservation_data["metodo"]
        pago.estado = EstadoPagoEnum.aprobado
        pago.referencia_externa = reservation_data["referencia"]
        pago.fecha_pago = datetime.utcnow()
        db.add(pago)
    else:
        db.add(
            Pago(
                reserva_id=reserva.id,
                monto=total,
                moneda="PEN",
                metodo=reservation_data["metodo"],
                estado=EstadoPagoEnum.aprobado,
                referencia_externa=reservation_data["referencia"],
                fecha_pago=datetime.utcnow(),
            )
        )

    room.estado = EstadoHabitacionEnum.libre
    db.add(room)
    return action


def rebuild_habitaciones_populares(db) -> int:
    approved_rows = (
        db.query(
            Reserva.habitacion_id.label("habitacion_id"),
            func.count(Reserva.id).label("total_reservas"),
            func.max(Pago.fecha_pago).label("fecha_ultima_reserva"),
        )
        .join(Pago, Pago.reserva_id == Reserva.id)
        .filter(Pago.estado == EstadoPagoEnum.aprobado)
        .group_by(Reserva.habitacion_id)
        .all()
    )

    db.query(HabitacionPopular).delete()

    for row in approved_rows:
        db.add(
            HabitacionPopular(
                habitacion_id=row.habitacion_id,
                total_reservas=int(row.total_reservas),
                fecha_ultima_reserva=row.fecha_ultima_reserva or datetime.utcnow(),
            )
        )

    return len(approved_rows)


def seed_data() -> None:
    settings = get_settings()
    print(f"Using database: {settings.db_name} at {settings.db_host}:{settings.db_port}")

    init_db()
    db = SessionLocal()

    user_created = 0
    user_updated = 0
    room_created = 0
    room_updated = 0
    reservation_created = 0
    reservation_updated = 0
    popular_created = 0

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

        # Asegurar que usuarios y habitaciones queden visibles en esta misma transaccion
        db.flush()

        # Reservas pagadas de ejemplo
        for reservation in SEED_PAID_RESERVATIONS:
            action = upsert_paid_reservation(db, reservation)
            if action == "created":
                reservation_created += 1
            else:
                reservation_updated += 1

        popular_created = rebuild_habitaciones_populares(db)

        db.commit()

        print("\nSeed completado correctamente:")
        print(f"- Usuarios creados: {user_created}")
        print(f"- Usuarios actualizados: {user_updated}")
        print(f"- Habitaciones creadas: {room_created}")
        print(f"- Habitaciones actualizadas: {room_updated}")
        print(f"- Reservas pagadas creadas: {reservation_created}")
        print(f"- Reservas pagadas actualizadas: {reservation_updated}")
        print(f"- Habitaciones populares reconstruidas: {popular_created}")
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
