from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.crud.habitacion_popular import get_top_habitaciones_populares
from app.database import get_db
from app.models import EstadoPagoEnum, EstadoReservaEnum, Habitacion, Pago, Reserva, Resena, Usuario
from app.schemas.habitacion_popular import HabitacionPopularResponse
from app.schemas.resena import ResenaDashboardItem, ResenaDashboardResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
):
    """
    Devuelve métricas principales para el dashboard administrativo.
    """
    today = date.today()

    total_habitaciones = db.query(func.count(Habitacion.id)).scalar() or 0

    ocupadas_hoy = (
        db.query(func.count(func.distinct(Reserva.habitacion_id)))
        .filter(Reserva.estado == EstadoReservaEnum.activo)
        .filter(Reserva.fecha_checkin <= today)
        .filter(Reserva.fecha_checkout > today)
        .scalar()
        or 0
    )

    reservas_pendientes = (
        db.query(func.count(Reserva.id))
        .filter(Reserva.estado == EstadoReservaEnum.pendiente)
        .scalar()
        or 0
    )

    inicio_mes = date(today.year, today.month, 1)
    if today.month == 12:
        inicio_mes_siguiente = datetime(today.year + 1, 1, 1)
    else:
        inicio_mes_siguiente = datetime(today.year, today.month + 1, 1)

    ingresos_mes = (
        db.query(func.coalesce(func.sum(Pago.monto), 0))
        .filter(Pago.estado == EstadoPagoEnum.aprobado)
        .filter(Pago.fecha_pago >= datetime(inicio_mes.year, inicio_mes.month, 1))
        .filter(Pago.fecha_pago < inicio_mes_siguiente)
        .scalar()
    )

    return {
        "total_habitaciones": int(total_habitaciones),
        "ocupadas_hoy": int(ocupadas_hoy),
        "reservas_pendientes": int(reservas_pendientes),
        "ingresos_mes": float(ingresos_mes or 0),
    }


@router.get("/habitaciones-populares", response_model=list[HabitacionPopularResponse])
def get_habitaciones_populares(
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
    limit: int = 5,
):
    """
    Devuelve ranking de habitaciones con mayor cantidad de reservas registradas.
    """
    safe_limit = max(1, min(limit, 20))
    return get_top_habitaciones_populares(db, limit=safe_limit)


@router.get("/resenas", response_model=ResenaDashboardResponse)
def get_resenas_dashboard(
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
    limit: int = 5,
):
    """
    Devuelve el promedio de reseñas y las más recientes para el dashboard administrativo.
    """
    safe_limit = max(1, min(limit, 20))

    total_resenas = db.query(func.count(Resena.id)).scalar() or 0
    promedio_puntuacion = db.query(func.coalesce(func.avg(Resena.puntuacion), 0)).scalar() or 0

    recent_rows = (
        db.query(Resena, Usuario.nombre.label("usuario_nombre"))
        .join(Usuario, Usuario.id == Resena.usuario_id)
        .order_by(Resena.fecha_creacion.desc())
        .limit(safe_limit)
        .all()
    )

    recientes = [
        ResenaDashboardItem(
            id=row.Resena.id,
            usuario_nombre=row.usuario_nombre,
            puntuacion=row.Resena.puntuacion,
            comentario=row.Resena.comentario,
            fecha_creacion=row.Resena.fecha_creacion,
        )
        for row in recent_rows
    ]

    return ResenaDashboardResponse(
        promedio_puntuacion=float(promedio_puntuacion or 0),
        total_resenas=int(total_resenas),
        recientes=recientes,
    )
