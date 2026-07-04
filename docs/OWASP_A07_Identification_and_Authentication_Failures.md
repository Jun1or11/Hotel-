# OWASP A07 — Identification and Authentication Failures — Hotel Nova

## 1. Descripción técnica

Identification and Authentication Failures (Fallos de Identificación y Autenticación) ocurren cuando el sistema no verifica correctamente la identidad de un usuario o permite credenciales débiles. Esto incluye: permitir contraseñas débiles o por defecto, no implementar límite de intentos (brute force), sesiones sin expiración o tokens JWT con tiempo de vida excesivo, registro insuficiente de intentos de autenticación (logging), funcionalidad de "recordarme" mal implementada, y debilidades en la recuperación de contraseña.

El objetivo de OWASP A07 es garantizar que la identidad de los usuarios esté protegida mediante políticas de contraseñas robustas, mecanismos antibrute-force, sesiones de duración limitada, y registro de eventos de autenticación para auditoría.

En Hotel Nova se encontraron **3 problemas** que ya fueron **REPARADOS**: el esquema `UsuarioCreate` aceptaba cualquier contraseña (incluso "a"), no había rate limiting en el login (brute force ilimitado), y no se registraban intentos de autenticación en logs.

## 2. Posible aparición en el sistema

Módulo afectado: Autenticación y validación
(backend/app/routers/auth.py, backend/app/schemas/usuario.py, backend/app/core/config.py)

| Componente | Archivo | Línea | Problema |
|---|---|---|---|
| Contraseña débil | `backend/app/schemas/usuario.py` | N/A | Sin validador de complejidad mínima |
| Sin bloqueo intentos | `backend/app/routers/auth.py` | 125-159 | POST `/api/auth/login` sin rate limiting |
| Token expiration | `backend/app/core/config.py` | 18 | `access_token_expire_minutes: int = 60` — Demasiado largo |
| Sin registro de intentos | `backend/app/routers/auth.py` | 125-159 | Sin logging de intentos fallidos |

### Hallazgos Detallados:

**Archivo:** `backend/app/schemas/usuario.py`
```python
class UsuarioCreate(BaseModel):
    dni: str
    nombre: str
    email: EmailStr
    password: str  # ❌ SIN VALIDADOR DE FUERZA
```
**Problema:** No hay validación de que la contraseña sea lo suficientemente fuerte. Ejemplos de contraseñas aceptadas:
- `password: "a"` (1 carácter)
- `password: "123"` (solo números)
- `password: "abc"` (solo letras minúsculas)

**Archivo:** `backend/app/routers/auth.py` (línea 125-159 aproximadamente)
```python
@router.post("/login")
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica un usuario."""
    # ❌ SIN RATE LIMITING
    # Cualquiera puede enviar 10,000 requests por segundo
    db_usuario = get_user_by_email(db, usuario.email)
    if not db_usuario or not verify_password(usuario.password, db_usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Credenciales inválidas")
    # ❌ SIN LOGGING DE INTENTO FALLIDO
    # No se registra quién intentó acceder
    access_token = create_access_token(...)
    return {"access_token": access_token, "user": db_usuario}
```
**Problema:** 
- No hay límite de intentos (brute force posible)
- No se registran intentos fallidos
- No hay delay entre intentos

**Archivo:** `backend/app/core/config.py` (línea 18)
```python
access_token_expire_minutes: int = 60  # ❌ 1 HORA ES DEMASIADO
```
**Problema:** Un JWT válido dura 60 minutos. Si se expone o se roba, el atacante tiene acceso prolongado.

### Consecuencia para la Empresa:

- **Acceso no autorizado:** Atacantes comprometen cuentas mediante fuerza bruta
- **Robo de datos:** Acceso a reservas, pagos, información personal de clientes
- **Fraude financiero:** Uso no autorizado de métodos de pago
- **Violación GDPR:** Exposición de datos personales
- **Reputación:** Pérdida de confianza de clientes y cumplimiento regulatorio

## 3. Medidas de mitigación

### Mitigación 1: Validar contraseña fuerte

**Acción:** Modificar `backend/app/schemas/usuario.py`

Agregar validador Pydantic:
```python
from pydantic import field_validator
import re

class UsuarioCreate(BaseModel):
    dni: str
    nombre: str
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Valida que la contraseña sea fuerte."""
        if len(v) < 8:
            raise ValueError('La contraseña debe tener mínimo 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('Debe contener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('Debe contener al menos un número')
        if not any(c in '!@#$%^&*' for c in v):
            raise ValueError('Debe contener al menos un símbolo: !@#$%^&*')
        return v
```

Requisitos mínimos:
- ✅ Mínimo 8 caracteres
- ✅ Al menos 1 mayúscula
- ✅ Al menos 1 número
- ✅ Al menos 1 símbolo especial

### Mitigación 2: Reducir token expiration

**Acción:** Modificar `backend/app/core/config.py` línea 18

De:
```python
access_token_expire_minutes: int = 60
```

A:
```python
access_token_expire_minutes: int = 30  # ✅ 30 minutos máximo
```

### Mitigación 3: Agregar rate limiting (SIN uso de slowapi, solo básico)

**Acción:** Crear nuevo archivo `backend/app/services/auth_service.py`

```python
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class LoginAttemptTracker:
    """Rastrea intentos de login fallidos (in-memory, para desarrollo)."""
    
    def __init__(self):
        self.attempts: Dict[str, List[datetime]] = {}
    
    def is_blocked(self, email: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """Verifica si el email está bloqueado por intentos fallidos."""
        if email not in self.attempts:
            return False
        
        # Limpiar intentos más antiguos que la ventana
        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
        self.attempts[email] = [ts for ts in self.attempts[email] if ts > cutoff_time]
        
        # Si hay más de max_attempts en la ventana, está bloqueado
        return len(self.attempts[email]) >= max_attempts
    
    def record_attempt(self, email: str):
        """Registra un intento fallido."""
        if email not in self.attempts:
            self.attempts[email] = []
        self.attempts[email].append(datetime.now())
        logger.warning(f"Failed login attempt for {email}. Total: {len(self.attempts[email])}")
    
    def reset(self, email: str):
        """Limpia intentos fallidos (al hacer login exitoso)."""
        if email in self.attempts:
            del self.attempts[email]
            logger.info(f"Login attempts reset for {email}")

# Instancia global
login_tracker = LoginAttemptTracker()
```

Luego modificar `backend/app/routers/auth.py`:
```python
from app.services.auth_service import login_tracker

@router.post("/login")
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica un usuario."""
    email = usuario.email.strip().lower()
    
    # ✅ VERIFICAR BLOQUEO
    if login_tracker.is_blocked(email):
        logger.warning(f"Login attempt on blocked account: {email}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos fallidos. Intenta en 15 minutos"
        )
    
    db_usuario = get_user_by_email(db, email)
    if not db_usuario or not verify_password(usuario.password, db_usuario.password_hash):
        login_tracker.record_attempt(email)  # ✅ REGISTRAR INTENTO FALLIDO
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    login_tracker.reset(email)  # ✅ LIMPIAR INTENTOS AL ÉXITO
    access_token = create_access_token(data={"sub": str(db_usuario.id), "email": db_usuario.email, "rol": db_usuario.rol.value})
    
    logger.info(f"Successful login for user {email}")
    
    return {"access_token": access_token, "user": db_usuario}
```

### Mitigación 4: Registrar intentos fallidos en logs

**Acción:** Agregar logging en `backend/app/routers/auth.py`

```python
import logging

logger = logging.getLogger(__name__)

@router.post("/login")
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica un usuario."""
    email = usuario.email.strip().lower()
    
    db_usuario = get_user_by_email(db, email)
    if not db_usuario or not verify_password(usuario.password, db_usuario.password_hash):
        logger.warning(f"Failed login attempt for email: {email}")  # ✅ LOG
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    
    logger.info(f"Successful login for user: {db_usuario.id}, email: {email}")  # ✅ LOG
    access_token = create_access_token(...)
    return {"access_token": access_token, "user": db_usuario}
```

## 4. Diseño de pruebas de seguridad

### Prueba 1: Contraseña débil es rechazada

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que contraseñas débiles son rechazadas en registro |
| **Procedimiento** | 1. Intentar registrar con contraseña "a":<br>`POST /api/auth/register`<br>`{"dni": "12345678", "nombre": "Test", "email": "test@test.com", "password": "a"}`<br>2. Intentar con "123"<br>3. Intentar con "abcdef" (sin mayúsculas ni números)<br>4. Intentar con "Test1!" (válida)<br>5. Observar respuesta |
| **Resultado esperado** | Contraseñas débiles: 422 Unprocessable Entity<br>Contraseña fuerte "Test1!": 200 OK |
| **Evidencia esperada** | Respuesta de error:<br>`{"detail": [{"type": "value_error", "msg": "La contraseña debe tener mínimo 8 caracteres"}]}`<br>Para "Test1!": Usuario creado exitosamente |

### Prueba 2: Bloqueo por intentos fallidos

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que el sistema bloquea después de 5 intentos fallidos |
| **Procedimiento** | 1. Crear usuario: email "user@test.com", password "CorrectPass123!"<br>2. Hacer 5 solicitudes de login con contraseña incorrecta:<br>`POST /api/auth/login` con `{"email": "user@test.com", "password": "WrongPassword"}`<br>3. En la 6ª solicitud, observar respuesta |
| **Resultado esperado** | Primeros 5 intentos: 401 Unauthorized<br>6º intento: 429 Too Many Requests con mensaje "Demasiados intentos fallidos" |
| **Evidencia esperada** | HTTP 429 response:<br>`{"detail": "Demasiados intentos fallidos. Intenta en 15 minutos"}` |

### Prueba 3: Token expiration en 30 minutos

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que el JWT expira en 30 minutos |
| **Procedimiento** | 1. Hacer login: `POST /api/auth/login`<br>2. Capturar token de response<br>3. Decodificar en jwt.io (sin verificación)<br>4. Calcular: `exp - iat` (diferencia en segundos)<br>5. Verificar que es ~1800 segundos (30 minutos) |
| **Resultado esperado** | Diferencia entre `exp` e `iat` es 1800 segundos (±10 segundos) |
| **Evidencia esperada** | Payload JWT:<br>`{"sub": "1", "email": "user@test.com", "rol": "huesped", "exp": 1720000000, "iat": 1719998200}`<br>Diferencia: 1800 segundos |

### Prueba 4: Logging de intentos fallidos

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que cada intento fallido se registra en logs |
| **Procedimiento** | 1. Activar logging en nivel WARNING:<br>`logging.basicConfig(level=logging.WARNING)`<br>2. Hacer 3 intentos fallidos de login<br>3. Revisar output de logs<br>4. Buscar mensajes como "Failed login attempt" |
| **Resultado esperado** | Logs contienen mensajes de intento fallido para cada request fallido |
| **Evidencia esperada** | Log output:<br>`WARNING:root:Failed login attempt for email: user@test.com`<br>`WARNING:root:Failed login attempt for email: user@test.com` |

### Prueba 5: Contraseña válida reset intentos fallidos

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que un login exitoso limpia el contador de intentos fallidos |
| **Procedimiento** | 1. Hacer 3 intentos fallidos de login<br>2. Hacer 1 intento exitoso (contraseña correcta)<br>3. Hacer 1 nuevo intento fallido<br>4. Verificar que el intento fallido después del éxito es aceptado (no está bloqueado)<br>5. El contador reinicia en 0 |
| **Resultado esperado** | Después de login exitoso, el contador de intentos fallidos se reinicia a 0 |
| **Evidencia esperada** | El 4º request (después del login exitoso) retorna 401, no 429<br>Logs muestran reset: `Login attempts reset for user@test.com` |


---
**Status:** ✅ CUMPLE | Fecha: 2026-07-03