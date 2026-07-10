from datetime import date, datetime
from decimal import Decimal

from app.models import (
    RolEnum, EstadoHabitacionEnum, EstadoReservaEnum,
    EstadoPagoEnum, MetodoPagoEnum, TipoEnum,
    Usuario, Habitacion, Reserva, Pago, Resena, Notificacion, HabitacionPopular
)


class TestUsuarioDefaults:
    def test_rol_defaults_to_huesped(self, db_session):
        u = Usuario(nombre="Test", email="test@gmail.com", password_hash="hash")
        db_session.add(u)
        db_session.flush()
        assert u.rol == RolEnum.huesped

    def test_activo_defaults_to_true(self, db_session):
        u = Usuario(nombre="Test", email="test@gmail.com", password_hash="hash")
        db_session.add(u)
        db_session.flush()
        assert u.activo is True

    def test_dni_nullable(self):
        u = Usuario(nombre="Test", email="test@gmail.com", password_hash="hash")
        assert u.dni is None


class TestHabitacionDefaults:
    def test_estado_defaults_to_libre(self, db_session):
        h = Habitacion(numero="101", tipo=TipoEnum.estandar, capacidad=2, precio_noche=Decimal("100.00"))
        db_session.add(h)
        db_session.flush()
        assert h.estado == EstadoHabitacionEnum.libre

    def test_amenidades_defaults_to_empty_dict(self, db_session):
        h = Habitacion(numero="102", tipo=TipoEnum.estandar, capacidad=2, precio_noche=Decimal("100.00"))
        db_session.add(h)
        db_session.flush()
        assert h.amenidades == {}


class TestReservaDefaults:
    def test_estado_defaults_to_pendiente(self, db_session):
        r = Reserva(
            usuario_id=1, habitacion_id=1,
            fecha_checkin=date(2026, 1, 1),
            fecha_checkout=date(2026, 1, 3),
            num_huespedes=2, total=Decimal("300.00")
        )
        db_session.add(r)
        db_session.flush()
        assert r.estado == EstadoReservaEnum.pendiente


class TestPagoDefaults:
    def test_estado_defaults_to_pendiente(self, db_session):
        p = Pago(reserva_id=1, monto=Decimal("300.00"))
        db_session.add(p)
        db_session.flush()
        assert p.estado == EstadoPagoEnum.pendiente

    def test_metodo_defaults_to_mercadopago(self, db_session):
        p = Pago(reserva_id=1, monto=Decimal("300.00"))
        db_session.add(p)
        db_session.flush()
        assert p.metodo == MetodoPagoEnum.mercadopago

    def test_moneda_defaults_to_usd(self, db_session):
        p = Pago(reserva_id=1, monto=Decimal("300.00"))
        db_session.add(p)
        db_session.flush()
        assert p.moneda == "USD"


class TestNotificacionDefaults:
    def test_leida_defaults_to_false(self, db_session):
        n = Notificacion(usuario_id=1, mensaje="Test")
        db_session.add(n)
        db_session.flush()
        assert n.leida is False


class TestHabitacionPopularDefaults:
    def test_total_reservas_defaults_to_zero(self, db_session):
        hp = HabitacionPopular(habitacion_id=1)
        db_session.add(hp)
        db_session.flush()
        assert hp.total_reservas == 0


class TestResenaCreation:
    def test_create_resena(self, db_session):
        from app.crud.usuario import create_user
        from app.schemas.usuario import UsuarioCreate
        user = create_user(db_session, UsuarioCreate(dni="43678840", nombre="Test", email="resena.test@gmail.com", password="Junior11"))
        r = Resena(usuario_id=user.id, puntuacion=5, comentario="Excelente")
        db_session.add(r)
        db_session.flush()
        assert r.id is not None
        assert r.puntuacion == 5

    def test_resena_unique_usuario_id(self, db_session):
        from app.crud.usuario import create_user
        from app.schemas.usuario import UsuarioCreate
        from sqlalchemy.exc import IntegrityError
        import pytest

        user = create_user(db_session, UsuarioCreate(dni="43678841", nombre="Test", email="resena.dup@gmail.com", password="Junior11"))
        db_session.add(Resena(usuario_id=user.id, puntuacion=4, comentario="Bueno"))
        db_session.flush()
        db_session.add(Resena(usuario_id=user.id, puntuacion=3, comentario="Regular"))
        with pytest.raises(IntegrityError):
            db_session.flush()
