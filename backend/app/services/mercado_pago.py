from fastapi import HTTPException, status
from urllib.parse import urlparse


def _supports_auto_return(url: str) -> bool:
    """
    Mercado Pago may reject auto_return for local/invalid URLs.
    Only enable it for absolute, non-localhost HTTP(S) URLs.
    """
    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    host = (parsed.hostname or "").lower()
    if not host or host in {"localhost", "127.0.0.1", "::1"}:
        return False

    return True


class MercadoPagoService:
    def __init__(self, access_token: str):
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Mercado Pago no configurado. Define MERCADOPAGO_ACCESS_TOKEN en .env",
            )

        try:
            import mercadopago  # type: ignore
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Dependencia Mercado Pago no instalada",
            )

        self.sdk = mercadopago.SDK(access_token)
        self.is_test_token = access_token.startswith("TEST-")

    def create_reserva_preference(
        self,
        *,
        habitacion_numero: str,
        habitacion_tipo: str,
        total: float,
        payer_name: str,
        payer_email: str,
        external_reference: str,
        success_url: str,
        pending_url: str,
        failure_url: str,
        currency_id: str = "PEN",
        notification_url: str | None = None,
    ) -> dict:
        preference_data = {
            "items": [
                {
                    "title": f"Habitación {habitacion_numero} - {habitacion_tipo}",
                    "quantity": 1,
                    "unit_price": float(total),
                    "currency_id": currency_id,
                }
            ],
            "payer": {
                "name": payer_name,
                "email": payer_email,
            },
            "binary_mode": True,
            "external_reference": external_reference,
            "back_urls": {
                "success": success_url,
                "pending": pending_url,
                "failure": failure_url,
            },
        }

        # Prevent invalid_auto_return in local/dev URLs (e.g. localhost).
        if _supports_auto_return(success_url):
            preference_data["auto_return"] = "approved"

        if notification_url:
            preference_data["notification_url"] = notification_url

        try:
            resultado = self.sdk.preference().create(preference_data)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error de conexión con Mercado Pago: {exc}",
            )

        response_status = resultado.get("status")
        response_data = resultado.get("response", {})

        if response_status not in (200, 201):
            mp_message = response_data.get("message") or resultado.get("message") or "Error desconocido"
            mp_error = response_data.get("error") or resultado.get("error")
            cause = response_data.get("cause")
            detail_parts = [f"Mercado Pago rechazó la preferencia ({response_status})."]
            if mp_error:
                detail_parts.append(f"error={mp_error}")
            if mp_message:
                detail_parts.append(f"message={mp_message}")
            if cause:
                detail_parts.append(f"cause={cause}")

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=" ".join(detail_parts),
            )

        # Use sandbox checkout only with TEST credentials to avoid redirect loops.
        if self.is_test_token:
            init_point = response_data.get("sandbox_init_point") or response_data.get("init_point")
        else:
            init_point = response_data.get("init_point") or response_data.get("sandbox_init_point")

        if not init_point:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No se pudo crear la preferencia de pago",
            )

        return {
            "init_point": init_point,
            "preference_id": response_data.get("id"),
        }
