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
        <body style=\"margin:0;padding:0;background:#ffffff;font-family:Segoe UI,Arial,sans-serif;color:#f2eee8;\">
            <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ffffff;padding:22px 10px;\">
            <tr>
                <td align=\"center\">
                    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#141416;border:1px solid #2a2a2f;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,0.42);\">
                        <tr>
                            <td style=\"padding:18px 20px 14px;background:linear-gradient(135deg,#111111 0%,#1c1c1f 100%);border-bottom:1px solid #2a2a2f;\">
                                <div style=\"display:inline-block;padding:6px 10px;border:1px solid rgba(200,169,110,0.55);border-radius:999px;color:#c8a96e;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;\">Hotel Nova</div>
                                <h1 style=\"margin:10px 0 6px;font-size:22px;line-height:1.15;color:#f7f2ea;\">Reserva Confirmada</h1>
                                <p style=\"margin:0;font-size:13px;line-height:1.4;color:#b8b1a8;\">Hola <strong style=\"color:#ffffff;\">{guest_name}</strong>, tu reserva fue confirmada. Aquí tienes el detalle.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:14px 20px 18px;\">
                                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border:1px solid #2a2a2f;border-radius:14px;overflow:hidden;\">
                                    <tr>
                                        <td style=\"padding:11px 12px;background:#1c1c1f;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b8b1a8;width:40%;\">Reserva</td>
                                        <td style=\"padding:11px 12px;background:#161618;font-size:14px;font-weight:700;color:#f7f2ea;\">#{reserva_id}</td>
                                    </tr>
                                    <tr>
                                        <td style=\"padding:11px 12px;background:#1c1c1f;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b8b1a8;\">Habitación</td>
                                        <td style=\"padding:11px 12px;background:#161618;font-size:14px;color:#f7f2ea;\">{room_label}</td>
                                    </tr>
                                    <tr>
                                        <td style=\"padding:11px 12px;background:#1c1c1f;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b8b1a8;\">Fechas</td>
                                        <td style=\"padding:11px 12px;background:#161618;font-size:14px;color:#f7f2ea;\">{fecha_checkin} - {fecha_checkout}</td>
                                    </tr>
                                    <tr>
                                        <td style=\"padding:11px 12px;background:#1c1c1f;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b8b1a8;\">Total pagado</td>
                                        <td style=\"padding:11px 12px;background:#161618;font-size:15px;font-weight:800;color:#4fd1c5;\">{total}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:0 20px 18px;\">
                                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-top:1px solid #2a2a2f;padding-top:14px;\">
                                    <tr>
                                        <td style=\"font-size:12px;color:#8c857d;line-height:1.45;\">Gracias por elegir <strong style=\"color:#f7f2ea;\">Hotel Nova</strong>.</td>
                                    </tr>
                                </table>
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
