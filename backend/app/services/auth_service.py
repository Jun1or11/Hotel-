"""
✅ A07 - Authentication Failures Mitigation
Servicio para rastrear intentos fallidos de login y bloquear por fuerza bruta.
"""

from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class LoginAttemptTracker:
    """
    Rastrea intentos de login fallidos en memoria.
    En desarrollo local: suficiente para prevenir ataques básicos.
    En producción: usar Redis o base de datos para persistencia.
    """
    
    def __init__(self):
        self.attempts: Dict[str, List[datetime]] = {}
    
    def is_blocked(self, email: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """
        Verifica si un email está bloqueado por demasiados intentos fallidos.
        
        Args:
            email: Email del usuario
            max_attempts: Máximo de intentos permitidos
            window_minutes: Ventana de tiempo en minutos
        
        Returns:
            True si está bloqueado, False caso contrario
        """
        if email not in self.attempts:
            return False
        
        # Limpiar intentos más antiguos que la ventana
        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
        self.attempts[email] = [ts for ts in self.attempts[email] if ts > cutoff_time]
        
        # Si hay más de max_attempts en la ventana, está bloqueado
        is_blocked = len(self.attempts[email]) >= max_attempts
        
        if is_blocked:
            logger.warning(
                f"Login attempts exceeded for {email}: "
                f"{len(self.attempts[email])}/{max_attempts} attempts"
            )
        
        return is_blocked
    
    def record_attempt(self, email: str):
        """Registra un intento fallido de login."""
        if email not in self.attempts:
            self.attempts[email] = []
        
        self.attempts[email].append(datetime.now())
        
        # Limpiar intentos antiguos
        cutoff_time = datetime.now() - timedelta(minutes=15)
        self.attempts[email] = [ts for ts in self.attempts[email] if ts > cutoff_time]
        
        logger.warning(
            f"Failed login attempt for {email}. "
            f"Total in last 15 min: {len(self.attempts[email])}"
        )
    
    def reset(self, email: str):
        """Limpia intentos fallidos después de login exitoso."""
        if email in self.attempts:
            del self.attempts[email]
            logger.info(f"Login attempts counter reset for {email}")


# Instancia global del tracker
login_tracker = LoginAttemptTracker()
