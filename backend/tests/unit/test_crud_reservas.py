from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.crud.reserva import create_reserva, get_reserva_by_id, get_user_reservas, get_all_reservas, update_reserva_estado, delete_reserva, check_overlap
from app.crud.usuario import create_user
from app.crud.habitacion import create_habitacion
from app.schemas.reserva import ReservaCreate
from app.schemas.usuario import UsuarioCreate
from app.schemas.habitacion import HabitacionCreate
from app.models import TipoEnum, EstadoReservaEnum


@pytest.fixture
def usuario(db_session):
    data = UsuarioCreate(dni="43678840", nombre="Test User", email="reserva.test@gmail.com", password="Junior11")
    return create_user(db_session, data)


@pytest.fixture
def habitacion(db_session):
    data = HabitacionCreate(numero="R1", tipo=TipoEnum.estandar, capacidad=2, precio_noche=Decimal("100.00"))
    return create_habitacion(db_session, data)


class TestCheckOverlap:
    def test_no_overlap(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 6, 1),
            fecha_checkout=date(2026, 6, 5),
            num_huespedes=2
        )
        create_reserva(db_session, rc, usuario.id)
        assert check_overlap(db_session, habitacion.id, date(2026, 6, 10), date(2026, 6, 15)) is False

    def test_overlap_exact_dates(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 6, 1),
            fecha_checkout=date(2026, 6, 5),
            num_huespedes=2
        )
        create_reserva(db_session, rc, usuario.id)
        assert check_overlap(db_session, habitacion.id, date(2026, 6, 1), date(2026, 6, 5)) is True

    def test_overlap_partial(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 6, 1),
            fecha_checkout=date(2026, 6, 10),
            num_huespedes=2
        )
        create_reserva(db_session, rc, usuario.id)
        assert check_overlap(db_session, habitacion.id, date(2026, 6, 5), date(2026, 6, 15)) is True

    def test_overlap_edge_checkin_equals_checkout(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 6, 1),
            fecha_checkout=date(2026, 6, 5),
            num_huespedes=2
        )
        create_reserva(db_session, rc, usuario.id)
        assert check_overlap(db_session, habitacion.id, date(2026, 6, 5), date(2026, 6, 10)) is False


class TestCreateReserva:
    def test_create_success(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 7, 1),
            fecha_checkout=date(2026, 7, 3),
            num_huespedes=2
        )
        r = create_reserva(db_session, rc, usuario.id)
        assert r.id is not None
        assert r.usuario_id == usuario.id
        assert r.habitacion_id == habitacion.id
        assert r.total == Decimal("200.00")
        assert r.estado == EstadoReservaEnum.pendiente

    def test_create_overlap_raises(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 8, 1),
            fecha_checkout=date(2026, 8, 5),
            num_huespedes=2
        )
        create_reserva(db_session, rc, usuario.id)
        rc2 = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 8, 3),
            fecha_checkout=date(2026, 8, 7),
            num_huespedes=2
        )
        with pytest.raises(HTTPException) as exc:
            create_reserva(db_session, rc2, usuario.id)
        assert exc.value.status_code == 400
        assert "no disponible" in exc.value.detail.lower()

    def test_create_nonexistent_room_raises(self, db_session, usuario):
        rc = ReservaCreate(
            habitacion_id=9999,
            fecha_checkin=date(2026, 9, 1),
            fecha_checkout=date(2026, 9, 3),
            num_huespedes=2
        )
        with pytest.raises(HTTPException) as exc:
            create_reserva(db_session, rc, usuario.id)
        assert exc.value.status_code == 404


class TestGetReserva:
    def test_get_by_id(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 10, 1),
            fecha_checkout=date(2026, 10, 3),
            num_huespedes=2
        )
        created = create_reserva(db_session, rc, usuario.id)
        r = get_reserva_by_id(db_session, created.id)
        assert r is not None
        assert r.id == created.id

    def test_get_nonexistent(self, db_session):
        r = get_reserva_by_id(db_session, 9999)
        assert r is None

    def test_get_user_reservas(self, db_session, usuario, habitacion):
        intervals = [(1, 3), (5, 7), (10, 12)]
        for checkin, checkout in intervals:
            rc = ReservaCreate(
                habitacion_id=habitacion.id,
                fecha_checkin=date(2026, 11, checkin),
                fecha_checkout=date(2026, 11, checkout),
                num_huespedes=2
            )
            create_reserva(db_session, rc, usuario.id)
        reservas = get_user_reservas(db_session, usuario.id)
        assert len(reservas) == 3


class TestUpdateReserva:
    def test_update_estado(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 12, 1),
            fecha_checkout=date(2026, 12, 3),
            num_huespedes=2
        )
        created = create_reserva(db_session, rc, usuario.id)
        updated = update_reserva_estado(db_session, created.id, "cancelado")
        assert updated.estado == EstadoReservaEnum.cancelado

    def test_update_nonexistent(self, db_session):
        result = update_reserva_estado(db_session, 9999, "cancelado")
        assert result is None


class TestDeleteReserva:
    def test_delete(self, db_session, usuario, habitacion):
        rc = ReservaCreate(
            habitacion_id=habitacion.id,
            fecha_checkin=date(2026, 12, 10),
            fecha_checkout=date(2026, 12, 12),
            num_huespedes=2
        )
        created = create_reserva(db_session, rc, usuario.id)
        result = delete_reserva(db_session, created.id)
        assert result is True
        assert get_reserva_by_id(db_session, created.id) is None

    def test_delete_nonexistent(self, db_session):
        result = delete_reserva(db_session, 9999)
        assert result is False
