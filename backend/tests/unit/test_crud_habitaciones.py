from decimal import Decimal

from app.crud.habitacion import create_habitacion, get_habitacion_by_id, get_all_habitaciones, update_habitacion, delete_habitacion
from app.schemas.habitacion import HabitacionCreate, HabitacionUpdate
from app.models import TipoEnum, EstadoHabitacionEnum


class TestCreateHabitacion:
    def test_create_habitacion_success(self, db_session):
        data = HabitacionCreate(
            numero="99",
            tipo=TipoEnum.estandar,
            capacidad=2,
            precio_noche=Decimal("150.00"),
            descripcion="Habitacion test"
        )
        h = create_habitacion(db_session, data)
        assert h.id is not None
        assert h.numero == "99"
        assert h.tipo == TipoEnum.estandar
        assert h.precio_noche == Decimal("150.00")
        assert h.estado == EstadoHabitacionEnum.libre

    def test_create_habitacion_duplicate_numero_raises(self, db_session):
        data = HabitacionCreate(
            numero="100",
            tipo=TipoEnum.suite,
            capacidad=4,
            precio_noche=Decimal("300.00")
        )
        create_habitacion(db_session, data)

        import pytest
        from sqlalchemy.exc import IntegrityError
        data2 = HabitacionCreate(
            numero="100",
            tipo=TipoEnum.suite,
            capacidad=4,
            precio_noche=Decimal("300.00")
        )
        with pytest.raises(IntegrityError):
            create_habitacion(db_session, data2)


class TestGetHabitacion:
    def test_get_by_id_found(self, db_session):
        data = HabitacionCreate(
            numero="201", tipo=TipoEnum.familiar,
            capacidad=4, precio_noche=Decimal("200.00")
        )
        created = create_habitacion(db_session, data)
        h = get_habitacion_by_id(db_session, created.id)
        assert h is not None
        assert h.numero == "201"

    def test_get_by_id_not_found(self, db_session):
        h = get_habitacion_by_id(db_session, 9999)
        assert h is None


class TestGetAllHabitaciones:
    def test_get_all(self, db_session):
        for i in range(3):
            data = HabitacionCreate(
                numero=f"3{i}",
                tipo=TipoEnum.estandar,
                capacidad=2,
                precio_noche=Decimal("100.00")
            )
            create_habitacion(db_session, data)
        habitaciones = get_all_habitaciones(db_session)
        assert len(habitaciones) == 3

    def test_filter_by_tipo(self, db_session):
        create_habitacion(db_session, HabitacionCreate(numero="1", tipo=TipoEnum.estandar, capacidad=2, precio_noche=Decimal("100")))
        create_habitacion(db_session, HabitacionCreate(numero="2", tipo=TipoEnum.suite, capacidad=4, precio_noche=Decimal("200")))
        create_habitacion(db_session, HabitacionCreate(numero="3", tipo=TipoEnum.estandar, capacidad=2, precio_noche=Decimal("100")))

        estandares = get_all_habitaciones(db_session, tipo="estandar")
        assert len(estandares) == 2

        suites = get_all_habitaciones(db_session, tipo="suite")
        assert len(suites) == 1


class TestUpdateHabitacion:
    def test_update_precio(self, db_session):
        data = HabitacionCreate(numero="301", tipo=TipoEnum.matrimonial, capacidad=2, precio_noche=Decimal("120"))
        created = create_habitacion(db_session, data)
        update = HabitacionUpdate(precio_noche=Decimal("150"))
        updated = update_habitacion(db_session, created.id, update)
        assert updated.precio_noche == Decimal("150")

    def test_update_nonexistent(self, db_session):
        update = HabitacionUpdate(precio_noche=Decimal("150"))
        result = update_habitacion(db_session, 9999, update)
        assert result is None


class TestDeleteHabitacion:
    def test_delete_habitacion(self, db_session):
        data = HabitacionCreate(numero="401", tipo=TipoEnum.estandar, capacidad=2, precio_noche=Decimal("100"))
        created = create_habitacion(db_session, data)
        result = delete_habitacion(db_session, created.id)
        assert result is True
        assert get_habitacion_by_id(db_session, created.id) is None

    def test_delete_nonexistent(self, db_session):
        result = delete_habitacion(db_session, 9999)
        assert result is False
