from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación usando Pydantic.
    """
    # Base de datos
    db_host: str = "localhost"
    db_port: int = 3311
    db_name: str = "hotel_nova"
    db_user: str = "root"
    db_password: str = ""

    # Seguridad
    secret_key: str = "dev-secret-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Integraciones
    mercadopago_access_token: str = ""
    frontend_url: str = "http://localhost:5173"
    mercadopago_currency_id: str = "PEN"
    backend_url: str = ""
    database_url_override: str = Field(
        default="",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "Hotel Nova"
    smtp_from_email: str = ""
    apiperu_token: str = Field(
        default="c39c586288dea5a5f6866f0366cae660130c696fd413f63f5527176b62a94733",
        validation_alias=AliasChoices("apiperu.token", "APIPERU_TOKEN"),
    )
    apiperu_url_dni: str = Field(
        default="https://apiperu.dev/api/dni",
        validation_alias=AliasChoices("apiperu.url.dni", "APIPERU_URL_DNI"),
    )

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            normalized_url = self.database_url_override.strip()
            if normalized_url.startswith("mysql://"):
                normalized_url = "mysql+pymysql://" + normalized_url[len("mysql://"):]
            return normalized_url

        return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
