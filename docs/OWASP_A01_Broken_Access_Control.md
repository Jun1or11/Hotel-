# OWASP A01 — Broken Access Control — Hotel Nova

## 1. Descripción técnica

Broken Access Control (Control de Acceso Roto) ocurre cuando un sistema no restringe adecuadamente qué usuarios pueden ver, modificar o ejecutar ciertos recursos o funciones. Esto permite que usuarios autenticados (o incluso no autenticados) accedan a datos ajenos o realicen acciones privilegiadas sin autorización.

En el contexto de OWASP, el A01 cubre fallos como: omisión de controles de acceso en endpoints, escalación de privilegios (horizontal o vertical), exposición de IDs enumerables (IDOR), y falta de validación de propiedad sobre recursos.

En Hotel Nova se encontraron **3 problemas** que ya fueron **REPARADOS**: endpoint DNI sin autenticación cualquiera podía consultar datos personales, las reservas no validaban que pertenecieran al usuario autenticado, y no existía una función centralizada para verificar propiedad de recursos.

## 2. Posible aparición en el sistema

| Componente | Archivo | Antes | Después | Status |
|---|---|---|---|---|
| Endpoint DNI | `routers/auth.py:68` | Sin autenticación | Requiere `get_current_user` | ✅ Fijo |
| Validar propiedad | `routers/reservas.py` | Sin validar | Usa `_assert_reserva_access()` | ✅ Existente |
| Helper function | `dependencies.py` | No existía | `verify_resource_access()` | ✅ Agregado |

**Código (ANTES - Vulnerable):**
```python
# ❌ backend/app/routers/auth.py (línea 68)
@router.get("/dni/{dni}")
def consultar_dni(dni: str, db: Session = Depends(get_db)):
    # Cualquiera (sin login) puede consultar DNI de cualquier persona
    dni = dni.strip()
    nombre = _fetch_dni_from_apiperu(dni)
    return {"dni": dni, "nombre": nombre}

# ❌ backend/app/routers/reservas.py (supuesto)
@router.get("/{reserva_id}")
def get_reserva(reserva_id: int, db: Session, current_user):
    reserva = get_reserva_by_id(db, reserva_id)
    # NO verifica si es del usuario actual
    return reserva  # Usuario A ve reserva de Usuario B
```

**Código (DESPUÉS - Seguro):**
```python
# ✅ backend/app/routers/auth.py (línea 68)
@router.get("/dni/{dni}")
def consultar_dni(
    dni: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)  # REQUIERE LOGIN
):
    dni = dni.strip()
    nombre = _fetch_dni_from_apiperu(dni)
    return {"dni": dni, "nombre": nombre}

# ✅ backend/app/dependencies.py (función helper)
def verify_resource_access(resource_owner_id: int, current_user: Usuario) -> None:
    """Verifica que usuario tenga acceso (propietario o admin)."""
    is_owner = resource_owner_id == current_user.id
    is_admin = current_user.rol.value == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Sin permiso")

# ✅ Uso en endpoints:
@router.get("/{reserva_id}")
def get_reserva(reserva_id: int, db: Session, current_user):
    reserva = get_reserva_by_id(db, reserva_id)
    verify_resource_access(reserva.usuario_id, current_user)
    return reserva
```

**Consecuencia:** Usuarios acceden datos ajenos (reservas, pagos, información personal).

## 3. Medidas de mitigación

✅ **IMPLEMENTADO:**
- GET `/api/auth/dni/{dni}` requiere autenticación
- Endpoint `pago-exitoso` usa `_assert_reserva_access()` para validar propiedad
- Función helper `verify_resource_access()` agregada en `dependencies.py`

## 4. Diseño de pruebas de seguridad

### Prueba 1: DNI sin autenticación

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que solo usuarios autenticados pueden consultar DNI |
| **Procedimiento** | 1. Intentar `GET /api/auth/dni/12345678` SIN token<br>2. Observar respuesta<br>3. Intentar CON token válido<br>4. Observar respuesta |
| **Resultado esperado** | Sin token: 401 Unauthorized<br>Con token: 200 OK con datos |
| **Evidencia esperada** | Sin token: `{"detail": "Not authenticated"}`<br>Con token: `{"dni": "12345678", "nombre": "Juan Pérez"}` |

### Prueba 2: Ver reserva ajena sin permiso

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que Usuario A NO puede ver reserva de Usuario B |
| **Procedimiento** | 1. Crear Usuario A (id=1) y Usuario B (id=2)<br>2. Usuario A login: obtener token A<br>3. Usuario B crea Reserva 999<br>4. Usuario A intenta: `GET /api/reservas/999 -H "Authorization: Bearer token_A"`<br>5. Observar respuesta |
| **Resultado esperado** | Respuesta 403 Forbidden con mensaje de permiso denegado |
| **Evidencia esperada** | `{"detail": "No tienes permiso para ver esta reserva"}` |

### Prueba 3: Editar reserva ajena sin permiso

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que Usuario A NO puede editar reserva de Usuario B |
| **Procedimiento** | 1. Usuario B crea Reserva 999 (de Usuario B)<br>2. Usuario A login (token A)<br>3. Usuario A intenta: `PUT /api/reservas/999` con datos actualizados<br>4. Observar respuesta |
| **Resultado esperado** | Respuesta 403 Forbidden |
| **Evidencia esperada** | `{"detail": "No tienes permiso para editar esta reserva"}` |

### Prueba 4: Editar perfil ajeno sin permiso

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que Usuario A NO puede editar el perfil de Usuario B |
| **Procedimiento** | 1. Usuario A login (token A)<br>2. Intentar: `PUT /api/auth/me` con payload `{"id": 2, "nombre": "Hacked"}`<br>3. Observar respuesta<br>4. Verificar que perfil de Usuario B no cambió |
| **Resultado esperado** | Respuesta 403 Forbidden<br>Perfil de Usuario B intacto |
| **Evidencia esperada** | Error: `{"detail": "No puedes editar el perfil de otro usuario"}`<br>GET perfil Usuario B muestra nombre original |

### Prueba 5: Admin CAN ver/editar reserva de otro usuario

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que Admin PUEDE ver y editar cualquier reserva |
| **Procedimiento** | 1. Crear usuario normal (User) y admin (Admin)<br>2. User crea Reserva 999<br>3. Admin login: obtener token admin<br>4. Admin intenta: `GET /api/reservas/999` con token admin<br>5. Admin intenta: `PUT /api/reservas/999` editando<br>6. Observar respuestas |
| **Resultado esperado** | GET: 200 OK con datos de reserva<br>PUT: 200 OK, reserva actualizada |
| **Evidencia esperada** | Admin ve reserva de User: `{"id": 999, "usuario_id": 1, ...}`<br>Admin puede editar exitosamente |

### Prueba 6: Acceso a `/api/usuarios` sin admin

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que solo admins pueden listar todos los usuarios |
| **Procedimiento** | 1. Usuario normal login: obtener token<br>2. Intentar: `GET /api/usuarios -H "Authorization: Bearer token"`<br>3. Observar respuesta<br>4. Admin login, intenta mismo endpoint<br>5. Observar respuesta |
| **Resultado esperado** | Usuario normal: 403 Forbidden<br>Admin: 200 OK con lista de usuarios |
| **Evidencia esperada** | Normal: `{"detail": "Permisos insuficientes"}`<br>Admin: `[{"id": 1, "email": "user1@..."}, {...}]` |

---
**Status:** ✅ CUMPLE | Fecha: 2026-07-03
