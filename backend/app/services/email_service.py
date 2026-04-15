import logging
import smtplib
from email.message import EmailMessage


logger = logging.getLogger(__name__)


def _build_reserva_confirmed_html(
        *,
        guest_name: str,
        reserva_id: int,
        room_label: str,
        fecha_checkin: str,
        fecha_checkout: str,
        total: str,
) -> str:
        return f"""
<!doctype html>
<html lang=\"es\">
    <body style=\"margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;\">
        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f4f6f8;padding:24px 12px;\">
            <tr>
                <td align=\"center\">
                    <table role=\"presentation\" width=\"620\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);\">
                        <tr>
                            <td style=\"padding:26px 28px;background:linear-gradient(135deg,#0f766e,#115e59);color:#ffffff;\">
                                <div style=\"font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.9;\">Hotel Nova</div>
                                <h1 style=\"margin:10px 0 8px;font-size:26px;line-height:1.2;\">Reserva Confirmada</h1>
                                <p style=\"margin:0;font-size:14px;opacity:0.95;\">Tu estadia esta lista. Te esperamos.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:24px 28px 8px;\">
                                <p style=\"margin:0 0 12px;font-size:15px;\">Hola <strong>{guest_name}</strong>,</p>
                                <p style=\"margin:0 0 18px;font-size:15px;color:#4b5563;\">Tu reserva fue confirmada exitosamente. Aqui tienes el detalle:</p>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:0 28px 8px;\">
                                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;\">
                                    <tr><td style=\"padding:12px 14px;background:#f9fafb;font-size:13px;color:#6b7280;width:40%;\">Numero de reserva</td><td style=\"padding:12px 14px;font-size:14px;font-weight:600;\">#{reserva_id}</td></tr>
                                    <tr><td style=\"padding:12px 14px;background:#f9fafb;font-size:13px;color:#6b7280;\">Habitacion</td><td style=\"padding:12px 14px;font-size:14px;\">{room_label}</td></tr>
                                    <tr><td style=\"padding:12px 14px;background:#f9fafb;font-size:13px;color:#6b7280;\">Check-in</td><td style=\"padding:12px 14px;font-size:14px;\">{fecha_checkin}</td></tr>
                                    <tr><td style=\"padding:12px 14px;background:#f9fafb;font-size:13px;color:#6b7280;\">Check-out</td><td style=\"padding:12px 14px;font-size:14px;\">{fecha_checkout}</td></tr>
                                    <tr><td style=\"padding:12px 14px;background:#f9fafb;font-size:13px;color:#6b7280;\">Total pagado</td><td style=\"padding:12px 14px;font-size:16px;font-weight:700;color:#0f766e;\">{total}</td></tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:20px 28px 26px;\">
                                <p style=\"margin:0 0 10px;font-size:14px;color:#4b5563;\">Gracias por elegir <strong>Hotel Nova</strong>.</p>
                                <p style=\"margin:0;font-size:12px;color:#9ca3af;\">Este es un correo automatico de confirmacion.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
"""


class EmailService:
    def __init__(
        self,
        *,
        host: str,
        port: int,
        username: str,
        password: str,
        from_name: str,
        from_email: str,
    ) -> None:
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.from_name = from_name
        self.from_email = from_email or username

    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.port and self.username and self.password and self.from_email)

    def send_reserva_confirmed_email(
        self,
        *,
        to_email: str,
        guest_name: str,
        reserva_id: int,
        room_label: str,
        fecha_checkin: str,
        fecha_checkout: str,
        total: str,
    ) -> None:
        if not self.is_configured:
            logger.warning("SMTP no configurado. Se omite envio de correo de reserva.")
            return

        message = EmailMessage()
        message["Subject"] = f"Reserva confirmada #{reserva_id} - Hotel Nova"
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to_email
        message.set_content(
            "\n".join(
                [
                    f"Hola {guest_name},",
                    "",
                    "Tu reserva fue confirmada exitosamente.",
                    "",
                    f"Numero de reserva: {reserva_id}",
                    f"Habitacion: {room_label}",
                    f"Check-in: {fecha_checkin}",
                    f"Check-out: {fecha_checkout}",
                    f"Total pagado: {total}",
                    "",
                    "Gracias por elegir Hotel Nova.",
                ]
            )
        )
        message.add_alternative(
            _build_reserva_confirmed_html(
                guest_name=guest_name,
                reserva_id=reserva_id,
                room_label=room_label,
                fecha_checkin=fecha_checkin,
                fecha_checkout=fecha_checkout,
                total=total,
            ),
            subtype="html",
        )

        try:
            with smtplib.SMTP(self.host, self.port, timeout=20) as smtp:
                smtp.starttls()
                smtp.login(self.username, self.password)
                smtp.send_message(message)
        except Exception as exc:
            logger.error("No se pudo enviar correo de confirmacion de reserva: %s", exc)
