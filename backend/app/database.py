from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

from app.core.config import get_settings

settings = get_settings()

# Crear engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=False
)

# Crear SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def init_db() -> None:
    """
    Crea tablas faltantes en el arranque.
    Importar modelos aquí asegura que SQLAlchemy registre los metadatos.
    """
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator:
    """
    Dependency para obtener sesión de BD en los endpoints.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
