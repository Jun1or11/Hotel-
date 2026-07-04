# A02 — Cryptographic Failures — Hotel Nova

## 1. Descripción técnica

Cryptographic Failures (Fallos Criptográficos) abarca la exposición de datos sensibles debido a una protección criptográfica inadecuada o inexistente. Esto incluye almacenar contraseñas en texto plano, usar algoritmos de hash débiles (MD5, SHA1 sin sal), cifrado débil o nulo en tránsito (HTTP en vez de HTTPS), tokens JWT sin firma o con expiración excesiva, y exposición de datos personales (PII) en respuestas API.

OWASP anteriormente llamaba a esta categoría "Sensitive Data Exposure". El foco está en garantizar que los datos sensibles estén protegidos tanto en reposo (storage) como en tránsito (transporte), usando algoritmos modernos y configuraciones seguras.

En Hotel Nova está **MITIGADA**: contraseñas se hashean con **bcrypt** (con sal automática), tokens JWT incluyen expiración (`exp`), nunca se almacenan credenciales en texto plano, y las comunicaciones deben realizarse sobre HTTPS.

## 2. Posible aparición en el sistema

| Componente | Archivo | Línea | Estado |
|---|---|---|---|
| Hash contraseña | `backend/app/core/security.py` | 9-10 | ✅ bcrypt |
| JWT expiración | `backend/app/core/security.py` | 28-35 | ✅ Token con `exp` |

**Código (correcto):**
```python
# ✅ backend/app/core/security.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str) -> str:
    return pwd_context.hash(password)  # Bcrypt con sal automática
```

**Consecuencia:** Sin esto, si la BD se compromete, todas las contraseñas se exponen.

## 3. Medidas de mitigación

✅ **IMPLEMENTADO** - Cumple OWASP A02. No se requieren cambios.

## 4. Diseño de pruebas

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que contraseñas se almacenan hasheadas, no en texto plano |
| **Procedimiento** | 1. Registrar usuario "Test@1234"<br>2. Consultar BD, campo `password_hash`<br>3. Verificar que comienza con `$2b$` (bcrypt) |
| **Resultado esperado** | `password_hash: $2b$12$abcd...` (hash, no texto) |
| **Evidencia esperada** | Captura BD mostrando hash bcrypt |

---

**Status:** ✅ CUMPLE | Fecha: 2026-07-03
