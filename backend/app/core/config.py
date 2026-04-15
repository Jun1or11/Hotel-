from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación usando Pydantic.
    """
    # Base de datos
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str

    # Seguridad
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    # Integraciones
    mercadopago_access_token: str = ""
    frontend_url: str = "http://localhost:5173"
    mercadopago_currency_id: str = "PEN"
    backend_url: str = ""
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
        return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
