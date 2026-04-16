import logging
from decimal import Decimal
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from typing import List

from app.core.config import get_settings
from app.database import get_db
from app.schemas.reserva import ReservaCreate, ReservaResponse, ReservaDetailResponse
from app.crud.reserva import (
    create_reserva,
    get_reserva_by_id,
    get_user_reservas,
    get_all_reservas,
    update_reserva_estado,
    delete_reserva
)
from app.crud.habitacion import get_habitacion_by_id, update_habitacion
from app.crud.habitacion_popular import register_habitacion_reserva
from app.crud.notificacion import create_notificacion
from app.schemas.habitacion import HabitacionUpdate
from app.core.dependencies import get_current_user, require_admin
from app.models import EstadoHabitacionEnum, EstadoPagoEnum, MetodoPagoEnum, Pago, Usuario
from app.services import EmailService, MercadoPagoService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reservas", tags=["reservas"])


def _verify_mp_payment_approved(
    mp_service: MercadoPagoService,
    *,
    reserva_id: int,
    payment_id: str,
    payment_status: str,
) -> bool:
    """
    Verify approval against Mercado Pago.
    - First by payment_id if present.
    - Fallback by searching latest payments using external_reference=reserva_id.
    - Final fallback to URL status for local/dev returns.
    """
    if payment_id:
        try:
            payment_info = mp_service.sdk.payment().get(int(payment_id))
            mp_status = payment_info.get("response", {}).get("status", "")
            logger.info(f"MP payment {payment_id} status from SDK: {mp_status}")
            if mp_status == "approved":
                return True
        except Exception as exc:
            logger.warning(f"Could not verify payment {payment_id} with MP SDK: {exc}")

    try:
        search_filters = {
            "external_reference": str(reserva_id),
            "sort": "date_created",
            "criteria": "desc",
            "limit": 5,
        }
        payments_search = mp_service.sdk.payment().search(search_filters)
        payment_results = payments_search.get("response", {}).get("results", [])
        for payment in payment_results:
            if payment.get("status") == "approved":
                logger.info(
                    "MP payment approved by search for reserva %s (payment_id=%s)",
                    reserva_id,
                    payment.get("id"),
                )
                return True
    except Exception as exc:
        logger.warning(f"Could not search MP payments for reserva {reserva_id}: {exc}")

    return payment_status == "approved"


def _assert_reserva_access(reserva, current_user: Usuario) -> None:
    is_admin = current_user.rol.value == "admin"
    is_owner = reserva.usuario_id == current_user.id
    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )


def _register_approved_payment(db: Session, *, reserva_id: int, amount: float, payment_id: str = "") -> bool:
    """Registra un pago aprobado sin duplicar por referencia externa.
    Retorna True cuando se crea un nuevo pago aprobado.
    """
    if payment_id:
        existing = db.query(Pago).filter(Pago.referencia_externa == payment_id).first()
        if existing:
            return False

    existing_approved = (
        db.query(Pago)
        .filter(Pago.reserva_id == reserva_id, Pago.estado == EstadoPagoEnum.aprobado)
        .first()
    )
    if existing_approved:
        return False

    pago = Pago(
        reserva_id=reserva_id,
        monto=amount,
        moneda="USD",
        metodo=MetodoPagoEnum.mercadopago,
        estado=EstadoPagoEnum.aprobado,
        referencia_externa=payment_id or None,
    )
    db.add(pago)
    return True


def _format_currency(value: Decimal | float | int | str) -> str:
    try:
        return f"S/ {Decimal(str(value)):.2f}"
    except Exception:
        return f"S/ {value}"


def _queue_reserva_confirmation_email(background_tasks: BackgroundTasks, db: Session, reserva) -> None:
    usuario = db.query(Usuario).filter(Usuario.id == reserva.usuario_id).first()
    if not usuario or not usuario.email:
        logger.warning("No se pudo enviar correo para reserva %s: usuario sin email", reserva.id)
        return

    habitacion = get_habitacion_by_id(db, reserva.habitacion_id)
    room_label = (
        f"Habitacion {habitacion.numero} ({habitacion.tipo.value})"
        if habitacion
        else f"Habitacion ID {reserva.habitacion_id}"
    )

    settings = get_settings()
    email_service = EmailService(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        from_name=settings.smtp_from_name,
        from_email=settings.smtp_from_email,
    )

    if not email_service.is_configured:
        logger.warning("SMTP no configurado. Correo de confirmacion omitido para reserva %s", reserva.id)
        return

    background_tasks.add_task(
        email_service.send_reserva_confirmed_email,
        to_email=usuario.email,
        guest_name=usuario.nombre,
        reserva_id=reserva.id,
        room_label=room_label,
        fecha_checkin=str(reserva.fecha_checkin),
        fecha_checkout=str(reserva.fecha_checkout),
        total=_format_currency(reserva.total),
    )


@router.post("", response_model=ReservaResponse)
def create_new_reserva(
    reserva: ReservaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea una nueva reserva para el usuario actual.
    """
    return create_reserva(db, reserva, current_user.id)


@router.post("/{reserva_id}/pagar")
def pagar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea preferencia de pago de Mercado Pago para una reserva existente.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    _assert_reserva_access(reserva, current_user)

    if reserva.estado.value != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede pagar una reserva pendiente"
        )

    habitacion = get_habitacion_by_id(db, reserva.habitacion_id)
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habitación no encontrada"
        )

    settings = get_settings()
    mp_service = MercadoPagoService(settings.mercadopago_access_token)
    # Include reserva_id in the return URL so the frontend can identify the reservation
    base_return_url = f"{settings.frontend_url}/mis-reservas?reserva_id={reserva.id}"

    # Build webhook/notification URL
    backend_url = settings.backend_url if hasattr(settings, 'backend_url') and settings.backend_url else ""
    notification_url = f"{backend_url}/api/reservas/webhook/mercadopago" if backend_url else None

    return mp_service.create_reserva_preference(
        habitacion_numero=str(habitacion.numero),
        habitacion_tipo=habitacion.tipo.value,
        total=float(reserva.total),
        payer_name=current_user.nombre,
        payer_email=current_user.email,
        external_reference=str(reserva.id),
        success_url=base_return_url,
        pending_url=base_return_url,
        failure_url=base_return_url,
        currency_id=settings.mercadopago_currency_id,
        notification_url=notification_url,
    )


@router.get("/{reserva_id}/pago-exitoso", response_model=ReservaResponse)
def pago_exitoso(
    reserva_id: int,
    background_tasks: BackgroundTasks,
    payment_id: str = "",
    payment_status: str = Query("", alias="status"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Recibe confirmación de pago y actualiza reserva.
    Intenta verificar el pago directamente con Mercado Pago SDK.
    Si no puede verificar con el SDK, usa el status de la URL.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    _assert_reserva_access(reserva, current_user)

    # If already confirmed, just return
    if reserva.estado.value == "activo":
        return reserva

    settings = get_settings()
    mp_service = MercadoPagoService(settings.mercadopago_access_token)
    verified = _verify_mp_payment_approved(
        mp_service,
        reserva_id=reserva_id,
        payment_id=payment_id,
        payment_status=payment_status,
    )

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El pago no fue aprobado"
        )

    reserva.estado = "activo"
    _register_approved_payment(
        db,
        reserva_id=reserva.id,
        amount=float(reserva.total),
        payment_id=payment_id,
    )
    register_habitacion_reserva(db, reserva.habitacion_id)
    db.add(reserva)
    db.commit()
    db.refresh(reserva)
    _queue_reserva_confirmation_email(background_tasks, db, reserva)
    logger.info(f"Reserva {reserva_id} confirmed via pago-exitoso endpoint")

    return reserva


@router.post("/webhook/mercadopago")
async def mercadopago_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Webhook/IPN endpoint for Mercado Pago notifications.
    This is called automatically by Mercado Pago when a payment status changes.
    No authentication required — Mercado Pago calls this directly.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "ignored"}

    logger.info(f"MP webhook received: {body}")

    # Mercado Pago sends different types of notifications
    topic = body.get("type") or body.get("topic")
    if topic != "payment":
        return {"status": "ignored", "reason": f"topic={topic}"}

    # Get the payment ID from the notification
    data = body.get("data", {})
    payment_id = data.get("id") or body.get("data.id")

    if not payment_id:
        logger.warning("MP webhook: no payment_id in notification")
        return {"status": "error", "reason": "no payment_id"}

    # Query Mercado Pago for the actual payment details
    try:
        settings = get_settings()
        mp_service = MercadoPagoService(settings.mercadopago_access_token)
        payment_info = mp_service.sdk.payment().get(int(payment_id))
        payment_response = payment_info.get("response", {})
    except Exception as exc:
        logger.error(f"MP webhook: error fetching payment {payment_id}: {exc}")
        return {"status": "error", "reason": str(exc)}

    mp_status = payment_response.get("status", "")
    external_ref = payment_response.get("external_reference", "")

    logger.info(f"MP webhook: payment={payment_id}, status={mp_status}, ref={external_ref}")

    if mp_status != "approved" or not external_ref:
        return {"status": "ok", "action": "no_update", "mp_status": mp_status}

    # Update the reservation
    try:
        reserva_id = int(external_ref)
    except (ValueError, TypeError):
        logger.error(f"MP webhook: invalid external_reference={external_ref}")
        return {"status": "error", "reason": "invalid external_reference"}

    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        logger.error(f"MP webhook: reserva {reserva_id} not found")
        return {"status": "error", "reason": "reserva not found"}

    if reserva.estado.value != "activo":
        reserva.estado = "activo"
        _register_approved_payment(
            db,
            reserva_id=reserva.id,
            amount=float(reserva.total),
            payment_id=str(payment_id),
        )
        register_habitacion_reserva(db, reserva.habitacion_id)
        db.add(reserva)
        db.commit()
        db.refresh(reserva)
        _queue_reserva_confirmation_email(background_tasks, db, reserva)
        logger.info(f"MP webhook: reserva {reserva_id} updated to activo")

    return {"status": "ok", "reserva_id": reserva_id, "new_status": "activo"}


@router.get("/mis-reservas", response_model=List[ReservaDetailResponse])
def get_my_reservas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    estado: str | None = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Obtiene todas las reservas del usuario actual.
    """
    estados = None
    if estado:
        estados = [e.strip() for e in estado.split(",") if e.strip()]

    return get_user_reservas(db, current_user.id, estados=estados, skip=skip, limit=limit)


@router.get("", response_model=List[ReservaDetailResponse])
def list_all_reservas(
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
    skip: int = 0,
    limit: int = 100
):
    """
    Obtiene todas las reservas (solo administrador).
    """
    return get_all_reservas(db, skip, limit)


@router.put("/{reserva_id}/aprobar", response_model=ReservaResponse)
def approve_reserva(
    reserva_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Aprueba una reserva y cambia su estado a 'activo' (solo administrador).
    Solo se permite si la reserva ya tiene un pago aprobado.
    """
    reserva_before = get_reserva_by_id(db, reserva_id)
    if not reserva_before:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    approved_payment = (
        db.query(Pago.id)
        .filter(Pago.reserva_id == reserva_id, Pago.estado == EstadoPagoEnum.aprobado)
        .first()
    )
    if not approved_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede aprobar una reserva sin pago aprobado"
        )

    was_active = reserva_before.estado.value == "activo"
    reserva = update_reserva_estado(db, reserva_id, "activo")
    if not was_active and reserva.estado.value == "activo":
        _queue_reserva_confirmation_email(background_tasks, db, reserva)
    return reserva


@router.put("/{reserva_id}/checkin", response_model=ReservaResponse)
def checkin_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Realiza el check-in de una reserva (solo administrador).
    Solo funciona si la reserva está en estado 'pendiente'.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    if reserva.estado.value != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La reserva no está en estado pendiente"
        )
    
    # Cambiar estado de habitación a ocupado
    habitacion_update = HabitacionUpdate(estado=EstadoHabitacionEnum.ocupado)
    update_habitacion(db, reserva.habitacion_id, habitacion_update)
    
    return update_reserva_estado(db, reserva_id, "activo")


@router.put("/{reserva_id}/checkout", response_model=ReservaResponse)
def checkout_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Realiza el check-out de una reserva (solo administrador).
    Cambia el estado de la reserva a 'completado' y la habitación a 'libre'.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    # Cambiar estado de habitación a libre
    habitacion_update = HabitacionUpdate(estado=EstadoHabitacionEnum.libre)
    update_habitacion(db, reserva.habitacion_id, habitacion_update)
    
    return update_reserva_estado(db, reserva_id, "completado")


@router.put("/{reserva_id}/completar", response_model=ReservaResponse)
def completar_reserva_por_fecha(
    reserva_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Marca una reserva como completada cuando ya pasó su fecha de salida.
    También libera la habitación.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    if reserva.estado.value != "activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede completar una reserva activa"
        )

    habitacion_update = HabitacionUpdate(estado=EstadoHabitacionEnum.libre)
    update_habitacion(db, reserva.habitacion_id, habitacion_update)

    return update_reserva_estado(db, reserva_id, "completado")


@router.put("/{reserva_id}/liberar", response_model=ReservaResponse)
def liberar_habitacion_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin)
):
    """
    Libera la habitación por salida anticipada y marca la reserva como completada.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    if reserva.estado.value != "activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede liberar una reserva activa"
        )

    habitacion_update = HabitacionUpdate(estado=EstadoHabitacionEnum.libre)
    update_habitacion(db, reserva.habitacion_id, habitacion_update)

    return update_reserva_estado(db, reserva_id, "completado")


@router.put("/{reserva_id}/cancelar", response_model=ReservaResponse)
def cancel_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Cancela una reserva.
    Solo el administrador o el propietario de la reserva pueden cancelarla.
    """
    reserva = get_reserva_by_id(db, reserva_id)
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )
    
    # Verificar permisos
    is_admin = current_user.rol.value == "admin"
    is_owner = reserva.usuario_id == current_user.id
    
    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    
    reserva_actualizada = update_reserva_estado(db, reserva_id, "cancelado")
    if not reserva_actualizada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    habitacion_update = HabitacionUpdate(estado=EstadoHabitacionEnum.libre)
    update_habitacion(db, reserva.habitacion_id, habitacion_update)

    if is_admin and reserva.usuario_id != current_user.id:
        create_notificacion(
            db,
            usuario_id=reserva.usuario_id,
            mensaje=f"Tu reserva #{reserva.id} fue cancelada por administracion.",
        )

    return reserva_actualizada
