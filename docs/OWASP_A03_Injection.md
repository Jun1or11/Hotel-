# A03 — Injection — Hotel Nova

## 1. Descripción técnica

Injection (Inyección) ocurre cuando datos no confiables son enviados a un intérprete como parte de un comando o consulta. El atacante puede inyectar código malicioso que el intérprete ejecuta, permitiendo extraer, modificar o borrar datos, e incluso ejecutar comandos en el servidor. Los tipos más comunes son SQL Injection, NoSQL Injection, OS Command Injection y LDAP Injection.

La causa raíz es la concatenación de entradas del usuario directamente en consultas o comandos sin sanitización ni parametrización. La mejor defensa es usar consultas parametrizadas (prepared statements) u ORMs que separen datos de instrucciones.

En Hotel Nova está **MITIGADA**: usa **SQLAlchemy ORM** que parametriza automáticamente todas las queries (los valores siempre se pasan como parámetros separados), y **Pydantic** valida y transforma todas las entradas antes de que lleguen a la base de datos, eliminando el riesgo de inyección.

## 2. Posible aparición en el sistema

| Componente | Archivo | Antes | Después |
|---|---|---|---|
| CRUD usuarios | `backend/app/crud/usuario.py` | ❌ Raw SQL | ✅ ORM |
| CRUD reservas | `backend/app/crud/reserva.py` | ❌ Raw SQL | ✅ ORM |
| Validación DNI | `backend/app/routers/auth.py` | ❌ Sin validación | ✅ Pydantic |

**Código (correcto):**
```python
# ✅ backend/app/crud/usuario.py - ORM parametriza automáticamente
def get_user_by_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()
    # Genera: SELECT * FROM usuario WHERE email = $1 (parámetro seguro)

# ❌ Vulnerable (NO en tu código):
# query = f"SELECT * FROM usuario WHERE email = '{email}'"
```

**Consecuencia:** Sin ORM, ataques SQL injection extraen/borran datos.

## 3. Medidas de mitigación

✅ **IMPLEMENTADO** - ORM previene SQL injection. Nunca usar raw SQL con concatenación.

## 4. Diseño de pruebas

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que SQL injection no funciona |
| **Procedimiento** | 1. Intentar login con email: `test@test.com' OR '1'='1`<br>2. Pydantic rechaza (no es email válido)<br>3. BD no se ve comprometida |
| **Resultado esperado** | Pydantic rechaza email malformado antes de tocar BD |
| **Evidencia esperada** | Error 422: `"Invalid email format"` |

---

**Status:** ✅ CUMPLE | Fecha: 2026-07-03
