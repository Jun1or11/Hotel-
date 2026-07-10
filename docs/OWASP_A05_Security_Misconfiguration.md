# OWASP A05 — Security Misconfiguration — Hotel Nova

## 1. Descripción técnica

Security Misconfiguration (Configuración Incorrecta de Seguridad) es una de las vulnerabilidades más comunes y ocurre cuando componentes del sistema (servidores web, bases de datos, frameworks, variables de entorno) se dejan con configuraciones por defecto inseguras, se exponen secretos en el código fuente, se habilitan funcionalidades innecesarias, o se configuran permisos y cabeceras de seguridad de forma incorrecta.

Ejemplos típicos incluyen: claves secretas hardcodeadas, CORS excesivamente permisivo (`Access-Control-Allow-Origin: *`), depuración habilitada en producción, directorios expuestos, métodos HTTP innecesarios (PUT, DELETE, TRACE), cabeceras de seguridad faltantes (HSTS, CSP, X-Frame-Options), y tiempos de expiración de tokens demasiado largos.

En Hotel Nova se encontraron **3 fallos críticos** que ya fueron **REPARADOS**: secret key hardcodeada en `config.py` (cualquiera podía firmar JWT válidos), API token de APIPerú expuesto en el código, y CORS configurado con `["*"]` permitiendo cualquier origen y método.

## 2. Posible aparición en el sistema

| Componente | Archivo | Antes | Después | Status |
|---|---|---|---|---|
| Secret key | `config.py:14` | `"dev-secret-key-change-me"` | Variable `.env` | ✅ Fijo |
| CORS methods | `main.py:22` | `["*"]` | `["GET","POST","PUT"]` | ✅ Fijo |
| API token | `config.py:34` | Hardcodeado | Variable `.env` | ✅ Fijo |
| Token expiration | `config.py:18` | 60 minutos | 30 minutos | ✅ Fijo |

**Código (ANTES - Vulnerable):**
```python
# ❌ backend/app/core/config.py (línea 14)
secret_key: str = "dev-secret-key-change-me"

# ❌ backend/app/main.py (línea 22)
allow_methods=["*"]
allow_headers=["*"]
```

**Código (DESPUÉS - Seguro):**
```python
# ✅ backend/app/core/config.py (línea 14)
secret_key: str = Field(default=..., validation_alias=AliasChoices("SECRET_KEY"))

# ✅ backend/app/main.py (línea 22)
allow_methods=["GET", "POST", "PUT"]
allow_headers=["Content-Type", "Authorization"]

# ✅ backend/.env
SECRET_KEY=tu-clave-secreta-aqui
APIPERU_TOKEN=tu-token-aqui
```

**Consecuencia:** Atacantes falsifican tokens JWT y acceden como admin.

## 3. Medidas de mitigación

✅ **IMPLEMENTADO:**
- Secret key y API token movidos a `.env`
- CORS restringido a métodos necesarios
- Token expiration reducido a 30 minutos
- Archivo `.env.example` como plantilla

## 4. Diseño de pruebas

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que secret_key no está en el código |
| **Procedimiento** | 1. Abrir `config.py` línea 14<br>2. Verificar que `secret_key = Field(default=...)`<br>3. Grep: `grep -r "dev-secret-key" backend/` → vacío |
| **Resultado esperado** | Secret key requiere variable `SECRET_KEY` de `.env` |
| **Evidencia esperada** | **1.** `config.py` línea 14: `secret_key = Field(default=..., validation_alias=AliasChoices("SECRET_KEY"))`<br>**2.** Error sin `.env`: `ValidationError: SECRET_KEY is required` |

---

**Status:** ✅ IMPLEMENTADO | Fecha: 2026-07-03
