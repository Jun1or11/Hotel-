from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.database import get_db
from app.models import EstadoPagoEnum, Pago, Reserva, Usuario
from app.schemas.pago import PagoCreate, PagoResponse

router = APIRouter(prefix="/pagos", tags=["pagos"])


@router.post("", response_model=PagoResponse)
def create_pago(
    payload: PagoCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    reserva = db.query(Reserva).filter(Reserva.id == payload.reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

    pago = Pago(
        reserva_id=payload.reserva_id,
        monto=payload.monto,
        moneda=payload.moneda,
        metodo=payload.metodo,
        estado=payload.estado,
        referencia_externa=payload.referencia_externa,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)
    return pago


@router.get("", response_model=List[PagoResponse])
def list_pagos(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
    reserva_id: int | None = None,
    estado: EstadoPagoEnum | None = None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(Pago)
    if reserva_id is not None:
        query = query.filter(Pago.reserva_id == reserva_id)
    if estado is not None:
        query = query.filter(Pago.estado == estado)

    return query.order_by(Pago.fecha_pago.desc()).offset(skip).limit(limit).all()


@router.get("/mis-pagos", response_model=List[PagoResponse])
def my_pagos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Pago)
        .join(Reserva, Reserva.id == Pago.reserva_id)
        .filter(Reserva.usuario_id == current_user.id)
        .order_by(Pago.fecha_pago.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/resumen/mes-actual")
def resumen_pagos_mes_actual(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    today = date.today()
    inicio_mes = datetime(today.year, today.month, 1)
    if today.month == 12:
        inicio_mes_siguiente = datetime(today.year + 1, 1, 1)
    else:
        inicio_mes_siguiente = datetime(today.year, today.month + 1, 1)

    total_aprobado = (
        db.query(func.coalesce(func.sum(Pago.monto), 0))
        .filter(Pago.estado == EstadoPagoEnum.aprobado)
        .filter(Pago.fecha_pago >= inicio_mes)
        .filter(Pago.fecha_pago < inicio_mes_siguiente)
        .scalar()
    )

    cantidad = (
        db.query(func.count(Pago.id))
        .filter(Pago.estado == EstadoPagoEnum.aprobado)
        .filter(Pago.fecha_pago >= inicio_mes)
        .filter(Pago.fecha_pago < inicio_mes_siguiente)
        .scalar()
        or 0
    )

    return {
        "cantidad_pagos_aprobados": int(cantidad),
        "total_aprobado": float(total_aprobado or 0),
    }
