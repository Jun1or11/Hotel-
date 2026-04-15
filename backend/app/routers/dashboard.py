from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import EstadoPagoEnum, EstadoReservaEnum, Habitacion, Pago, Reserva

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
