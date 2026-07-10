from app.crud.usuario import create_user, get_user_by_email, get_user_by_id, get_all_users, update_user, delete_user
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


class TestCreateUser:
    def test_create_user_success(self, db_session):
        data = UsuarioCreate(
            dni="43678840",
            nombre="Test User",
            email="test.unit@gmail.com",
            password="Junior11"
        )
        user = create_user(db_session, data)
        assert user.id is not None
        assert user.email == "test.unit@gmail.com"
        assert user.nombre == "Test User"
        assert user.dni == "43678840"
        assert user.rol.value == "huesped"
        assert user.activo is True

    def test_create_user_duplicate_email_raises(self, db_session):
        data = UsuarioCreate(
            dni="43678841",
            nombre="User 1",
            email="dup@gmail.com",
            password="Junior11"
        )
        create_user(db_session, data)

        import pytest
        from sqlalchemy.exc import IntegrityError
        data2 = UsuarioCreate(
            dni="43678842",
            nombre="User 2",
            email="dup@gmail.com",
            password="Junior11"
        )
        with pytest.raises(IntegrityError):
            create_user(db_session, data2)


class TestGetUser:
    def test_get_by_email_found(self, db_session):
        data = UsuarioCreate(
            dni="43678840",
            nombre="Test",
            email="findme@gmail.com",
            password="Junior11"
        )
        create_user(db_session, data)
        user = get_user_by_email(db_session, "findme@gmail.com")
        assert user is not None
        assert user.email == "findme@gmail.com"

    def test_get_by_email_not_found(self, db_session):
        user = get_user_by_email(db_session, "nobody@gmail.com")
        assert user is None

    def test_get_by_id_found(self, db_session):
        data = UsuarioCreate(
            dni="43678840",
            nombre="Test",
            email="byid@gmail.com",
            password="Junior11"
        )
        created = create_user(db_session, data)
        user = get_user_by_id(db_session, created.id)
        assert user is not None
        assert user.id == created.id

    def test_get_all_users(self, db_session):
        for i in range(3):
            data = UsuarioCreate(
                dni=f"4367884{i}",
                nombre=f"User {i}",
                email=f"user{i}.unit@gmail.com",
                password="Junior11"
            )
            create_user(db_session, data)
        users = get_all_users(db_session)
        assert len(users) == 3


class TestUpdateUser:
    def test_update_user_name(self, db_session):
        data = UsuarioCreate(
            dni="43678840",
            nombre="Old Name",
            email="update@gmail.com",
            password="Junior11"
        )
        created = create_user(db_session, data)
        update_data = UsuarioUpdate(nombre="New Name")
        updated = update_user(db_session, created.id, update_data)
        assert updated.nombre == "New Name"

    def test_update_nonexistent_user(self, db_session):
        update_data = UsuarioUpdate(nombre="Nobody")
        result = update_user(db_session, 9999, update_data)
        assert result is None


class TestDeleteUser:
    def test_delete_user_without_reservas(self, db_session):
        data = UsuarioCreate(
            dni="43678840",
            nombre="To Delete",
            email="delete.me@gmail.com",
            password="Junior11"
        )
        created = create_user(db_session, data)
        result = delete_user(db_session, created.id)
        assert result is True
        assert get_user_by_id(db_session, created.id) is None

    def test_delete_nonexistent_user(self, db_session):
        result = delete_user(db_session, 9999)
        assert result is False
