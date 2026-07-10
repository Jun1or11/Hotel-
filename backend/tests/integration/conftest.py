import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import timedelta

from app.database import Base, get_db
from app.main import app
from app.core.security import create_access_token
from app.schemas.usuario import UsuarioCreate
from app.crud.usuario import create_user


@pytest.fixture
def db_session():
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_path = tmp.name
    tmp.close()
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    from app import models
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        try:
            os.unlink(db_path)
        except PermissionError:
            pass


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin(db_session):
    user = create_user(db_session, UsuarioCreate(
        dni="12345678",
        nombre="Admin Test",
        email="admin.integration@gmail.com",
        password="Admin11"
    ))
    user.rol = "admin"
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(test_admin):
    return create_access_token(
        data={"sub": str(test_admin.id), "email": test_admin.email, "rol": "admin"},
        expires_delta=timedelta(hours=1)
    )


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_guest(db_session):
    return create_user(db_session, UsuarioCreate(
        dni="87654321",
        nombre="Guest Test",
        email="guest.integration@gmail.com",
        password="Guest11"
    ))


@pytest.fixture
def guest_token(test_guest):
    return create_access_token(
        data={"sub": str(test_guest.id), "email": test_guest.email, "rol": "huesped"},
        expires_delta=timedelta(hours=1)
    )


@pytest.fixture
def guest_headers(guest_token):
    return {"Authorization": f"Bearer {guest_token}"}
