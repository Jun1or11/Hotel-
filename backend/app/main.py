from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, dashboard, habitaciones, notificaciones, pagos, reservas, resenas, usuarios
from app.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# Crear aplicación FastAPI
app = FastAPI(
    title="Hotel Nova API",
    description="API para gestionar reservas de hotel",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(habitaciones.router, prefix="/api")
app.include_router(reservas.router, prefix="/api")
app.include_router(pagos.router, prefix="/api")
app.include_router(usuarios.router, prefix="/api")
app.include_router(resenas.router, prefix="/api")
app.include_router(notificaciones.router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Hotel Nova API"}
