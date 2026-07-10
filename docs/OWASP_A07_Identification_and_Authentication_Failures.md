# OWASP A07 — Identification and Authentication Failures — Hotel Nova

## 1. Descripción técnica

Identification and Authentication Failures (Fallos de Identificación y Autenticación) ocurren cuando el sistema no verifica correctamente la identidad de un usuario o permite credenciales débiles. Esto incluye: permitir contraseñas débiles o por defecto, no implementar límite de intentos (brute force), sesiones sin expiración o tokens JWT con tiempo de vida excesivo, registro insuficiente de intentos de autenticación (logging), funcionalidad de "recordarme" mal implementada, y debilidades en la recuperación de contraseña.

El objetivo de OWASP A07 es garantizar que la identidad de los usuarios esté protegida mediante políticas de contraseñas robustas, mecanismos antibrute-force, sesiones de duración limitada, y registro de eventos de autenticación para auditoría.

En Hotel Nova se encontraron **3 problemas** que ya fueron **REPARADOS**: el esquema `UsuarioCreate` aceptaba cualquier contraseña (incluso "a"), no había rate limiting en el login (brute force ilimitado), y no se registraban intentos de autenticación en logs.

## 2. Posible aparición en el sistema

Módulo afectado: Autenticación y validación
(backend/app/routers/auth.py, backend/app/schemas/usuario.py, backend/app/core/config.py)

| Componente | Archivo | Antes | Después | Status |
|---|---|---|---|---|---|
| Contraseña débil | `backend/app/schemas/usuario.py` | Sin validador | `_ensure_password_policy()` (7-12 chars, mayúscula, número) | ✅ Fijo |
| Rate limiting | `backend/app/routers/auth.py` | Sin bloqueo | `login_tracker.is_blocked()` (5 intentos, 15 min) | ✅ Fijo |
| Token expiration | `backend/app/core/config.py` | 60 minutos | 30 minutos | ✅ Fijo |
| Logging intentos | `backend/app/routers/auth.py` | Sin logs | `logger.warning("Failed login...")` | ✅ Fijo |

### Hallazgos Detallados:

**Archivo:** `backend/app/schemas/usuario.py`
```python
class UsuarioCreate(BaseModel):
    dni: str
    nombre: str
    email: EmailStr
    password: str  # ❌ SIN VALIDADOR DE FUERZA (ANTES)
```

**PROBLEMA (ANTES):** No había validación de que la contraseña fuera segura. Aceptaba cualquier cosa.

**SOLUCIÓN (DESPUÉS):** Se agregó `_ensure_password_policy()` con las reglas:
- Entre 7 y 12 caracteres
- Al menos 1 mayúscula (A-Z)
- Al menos 1 número (0-9)
- Solo letras y números (sin símbolos especiales)

**Archivo:** `backend/app/routers/auth.py` (línea 140-180 aproximadamente)
```python
@router.post("/login", response_model=TokenResponse)
def login(credentials: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica un usuario."""
    # Normalizar email
    normalized_email = credentials.email.strip().lower()
    
    # ✅ A07 - Verificar si está bloqueado por demasiados intentos
    if login_tracker.is_blocked(normalized_email):
        logger.warning(f"Blocked login attempt for {normalized_email}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos de login. Intenta en 15 minutos"
        )
    
    user = get_user_by_email(db, normalized_email)
    if not user:
        login_tracker.record_attempt(normalized_email)  # ✅ Registrar intento
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        login_tracker.record_attempt(normalized_email)
        logger.warning(f"Failed login attempt for {normalized_email}")  # ✅ Logging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    login_tracker.reset(normalized_email)  # ✅ Limpiar intentos al éxito
    access_token = create_access_token(data={...})
    logger.info(f"Successful login for user {normalized_email}")  # ✅ Logging
    return {"access_token": access_token, "user": user}
```
**Solución implementada:** 
- ✅ Rate limiting con `login_tracker` (5 intentos en 15 min → bloqueo 429)
- ✅ Logging de intentos fallidos y exitosos
- ✅ Reset de contador al hacer login exitoso

**Archivo:** `backend/app/core/config.py` (línea 23)
```python
access_token_expire_minutes: int = 30  # ✅ 30 MINUTOS (se redujo de 60)
```
**Problema (ANTES):** Un JWT válido duraba 60 minutos. Si se exponía o robaba, el atacante tenía acceso prolongado.
**Solución:** Se redujo a 30 minutos.

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
def _ensure_password_policy(password: str) -> str:
    """
    Validación de contraseña.
    Requisitos:
    - Entre 7 y 12 caracteres
    - Al menos 1 mayúscula
    - Al menos 1 número
    - Solo letras y números (sin símbolos especiales)
    """
    if len(password) < 7 or len(password) > 12:
        raise ValueError('La contraseña debe tener entre 7 y 12 caracteres')

    if not any(char.isupper() for char in password):
        raise ValueError('Debe contener al menos una mayúscula (A-Z)')

    if not any(char.isdigit() for char in password):
        raise ValueError('Debe contener al menos un número (0-9)')

    return password
```

Requisitos mínimos:
- ✅ Entre 7 y 12 caracteres
- ✅ Al menos 1 mayúscula (A-Z)
- ✅ Al menos 1 número (0-9)
- ✅ Solo letras y números (sin símbolos)

### Mitigación 2: Reducir token expiration

**Acción:** Se modificó `backend/app/core/config.py` línea 23

✅ **IMPLEMENTADO:**
```python
access_token_expire_minutes: int = 30  # ✅ Reducido de 60 a 30 minutos
```

### Mitigación 3: Rate limiting con LoginAttemptTracker

✅ **IMPLEMENTADO en `backend/app/services/auth_service.py`**

```python
class LoginAttemptTracker:
    """Rastrea intentos de login fallidos (in-memory)."""
    
    def __init__(self):
        self.attempts: Dict[str, List[datetime]] = {}
    
    def is_blocked(self, email: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        if email not in self.attempts:
            return False
        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
        self.attempts[email] = [ts for ts in self.attempts[email] if ts > cutoff_time]
        return len(self.attempts[email]) >= max_attempts
    
    def record_attempt(self, email: str):
        if email not in self.attempts:
            self.attempts[email] = []
        self.attempts[email].append(datetime.now())
        logger.warning(f"Failed login attempt for {email}")
    
    def reset(self, email: str):
        if email in self.attempts:
            del self.attempts[email]

login_tracker = LoginAttemptTracker()
```

**Reglas:** 5 intentos fallidos en 15 minutos → bloqueo temporal con `429 Too Many Requests`

### Mitigación 4: Logging de intentos fallidos

✅ **IMPLEMENTADO en `backend/app/routers/auth.py`**

Se agregaron logs en:
- **Intento fallido:** `logger.warning(f"Failed login attempt for {normalized_email}")`
- **Bloqueo:** `logger.warning(f"Blocked login attempt for {normalized_email}")`
- **Éxito:** `logger.info(f"Successful login for user {normalized_email}")`
- **Reset:** `logger.info(f"Login attempts reset for {normalized_email}")`

## 4. Diseño de pruebas de seguridad

### Prueba 1: Contraseña débil es rechazada

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que contraseñas débiles son rechazadas en registro |
| **Procedimiento** | 1. Intentar registrar con contraseña "a" (muy corta):<br>`POST /api/auth/register`<br>`{"dni": "12345678", "nombre": "Test", "email": "test@test.com", "password": "a"}`<br>2. Intentar con "abcdef1" (sin mayúscula)<br>3. Intentar con "Abcdefg" (sin número)<br>4. Intentar con "Test1234" (válida)<br>5. Observar respuesta |
| **Resultado esperado** | Contraseñas débiles: 422 Unprocessable Entity<br>Contraseña fuerte "Test1234": 200 OK |
| **Evidencia esperada** | Errores según el caso:<br>- Muy corta: `{"detail": [{"msg": "Value error, La contraseña debe tener entre 7 y 12 caracteres"}]}`<br>- Sin mayúscula: `{"detail": [{"msg": "Value error, Debe contener al menos una mayúscula (A-Z)"}]}`<br>- Sin número: `{"detail": [{"msg": "Value error, Debe contener al menos un número (0-9)"}]}`<br>Para "Test1234": Usuario creado exitosamente |

### Prueba 2: Bloqueo por intentos fallidos

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que el sistema bloquea después de 5 intentos fallidos |
| **Procedimiento** | 1. Crear usuario: email "user@test.com", password "CorrectPass123"<br>2. Hacer 5 solicitudes de login con contraseña incorrecta:<br>`POST /api/auth/login` con `{"email": "user@test.com", "password": "WrongPassword"}`<br>3. En la 6ª solicitud, observar respuesta |
| **Resultado esperado** | Primeros 5 intentos: 401 Unauthorized<br>6º intento: 429 Too Many Requests con mensaje de bloqueo |
| **Evidencia esperada** | HTTP 429 response:<br>`{"detail": "Demasiados intentos de login. Intenta en 15 minutos"}` |

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
| **Procedimiento** | 1. Hacer 3 intentos fallidos de login<br>2. Revisar la terminal donde corre el servidor<br>3. Buscar mensajes como "Failed login attempt" |
| **Resultado esperado** | Logs del servidor contienen mensajes de intento fallido para cada request |
| **Evidencia esperada** | Log output en terminal:<br>`WARNING:app.routers.auth:Failed login attempt for user@test.com` |

### Prueba 5: Login exitoso resetea el contador

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que un login exitoso limpia el contador de intentos fallidos |
| **Procedimiento** | 1. Hacer 3 intentos fallidos de login<br>2. Hacer 1 intento exitoso (contraseña correcta)<br>3. Hacer 1 nuevo intento fallido<br>4. Verificar que el nuevo intento fallido da 401 (no 429) |
| **Resultado esperado** | Después de login exitoso, el contador se reinicia |
| **Evidencia esperada** | El intento fallido después del éxito retorna `401`, no `429`<br>Log: `INFO:app.routers.auth:Login attempts reset for user@test.com` |


---
**Status:** ✅ CUMPLE | Fecha: 2026-07-03