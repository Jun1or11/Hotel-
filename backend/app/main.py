from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, dashboard, habitaciones, pagos, reservas, resenas, usuarios
from app.database import init_db

# Crear aplicación FastAPI
app = FastAPI(
    title="Hotel Nova API",
    description="API para gestionar reservas de hotel",
    version="1.0.0"
)


@app.on_event("startup")
def startup_event() -> None:
    init_db()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(habitaciones.router, prefix="/api")
app.include_router(reservas.router, prefix="/api")
app.include_router(pagos.router, prefix="/api")
app.include_router(usuarios.router, prefix="/api")
app.include_router(resenas.router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Hotel Nova API"}
