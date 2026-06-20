# Pruebas Postman - Hotel Nova API

---

## APIs Públicas (sin token)

---

### Prueba 1: Consulta de DNI

**Objetivo:**
Validar que la API consulta el nombre completo de un usuario a partir de su DNI usando ApiPeru.dev y verifica si ya está registrado en Hotel Nova.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/auth/dni/74314540`
- Headers: ninguno (público)

**Resultado:**
```json
{
  "dni": "74314540",
  "nombre": "RAMOS FLORES, JUNIOR ALFREDO",
  "registradoEnHotelNova": true
}
```

**Interpretación:**
- `dni`: el DNI consultado se devuelve tal cual
- `nombre`: se obtiene automáticamente del servicio ApiPeru.dev, sin que el usuario lo escriba
- `registradoEnHotelNova: true` indica que el usuario ya tiene cuenta en Hotel Nova (si es `false`, puede registrarse)

**Conclusión:**
La API permite autocompletar el nombre durante el registro y evitar duplicados al detectar si el DNI ya está registrado en la plataforma.

---

### Prueba 2: Listar habitaciones

**Objetivo:**
Obtener todas las habitaciones disponibles con sus detalles y precios.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/habitaciones`

**Resultado esperado (16 habitaciones del seed):**
```json
[
  {
    "id": 1,
    "numero": "101",
    "tipo": "estandar",
    "capacidad": 2,
    "precio_noche": 120.0,
    "estado": "libre",
    "descripcion": "Habitación estándar con cama matrimonial, baño privado y TV cable.",
    "amenidades": {"wifi": true, "tv": true, "banio": "privado"}
  },
  {
    "id": 5,
    "numero": "201",
    "tipo": "matrimonial",
    "capacidad": 2,
    "precio_noche": 200.0,
    "estado": "libre",
    "descripcion": "Habitación matrimonial con cama king size...",
    "amenidades": {"wifi": true, "tv": true, "banio": "privado", "aire": true}
  },
  {
    "id": 9,
    "numero": "301",
    "tipo": "familiar",
    "capacidad": 4,
    "precio_noche": 250.0,
    "estado": "libre",
    "descripcion": "Habitación familiar con dos camas...",
    "amenidades": {"wifi": true, "tv": true, "banio": "privado", "aire": true, "balcon": true}
  },
  {
    "id": 13,
    "numero": "401",
    "tipo": "suite",
    "capacidad": 2,
    "precio_noche": 500.0,
    "estado": "libre",
    "descripcion": "Suite de lujo con cama king size...",
    "amenidades": {"wifi": true, "tv": true, "banio": "privado", "aire": true, "balcon": true, "jacuzzi": true}
  }
]
```

**Filtros opcionales (en Params de Postman):**

| Key | Value |
|-----|-------|
| `tipo` | `suite` |
| `capacidad` | `2` |
| `fecha_checkin` | `2026-07-01` |
| `fecha_checkout` | `2026-07-03` |

**Conclusión:**
Endpoint público que lista habitaciones con filtros de disponibilidad.


---

### Prueba 4: Registro de usuario

**Objetivo:**
Validar que un nuevo huésped puede registrarse correctamente en Hotel Nova.

**Procedimiento:**
- Método: `POST`
- URL: `http://localhost:8000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "dni": "12345678",
  "nombre": "JUAN PEREZ",
  "email": "juanperez@gmail.com",
  "password": "MiPassword1"
}
```

**Resultado esperado:**
```json
{
  "id": 5,
  "dni": "12345678",
  "nombre": "JUAN PEREZ",
  "email": "juanperez@gmail.com",
  "rol": "huesped",
  "activo": true,
  "fecha_registro": "2026-06-19T..."
}
```

**Interpretación:**
- El usuario se crea con rol `huesped` automáticamente
- El password se guarda hasheado (no visible en respuesta)
- El email debe ser @gmail.com, y la contraseña debe tener mayúscula, número y 7-12 caracteres

**Conclusión:**
El registro valida que el DNI y email no existan antes de crear la cuenta.

---

### Prueba 5: Inicio de sesión (para obtener token)

**Objetivo:**
Autenticarse y obtener el token JWT para acceder a endpoints protegidos.

**Procedimiento:**
- Método: `POST`
- URL: `http://localhost:8000/api/auth/login`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "admin1@hotelnova.com",
  "password": "Promocion135"
}
```

**Resultado:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "dni": null,
    "nombre": "Admin Hotel Nova",
    "email": "admin1@hotelnova.com",
    "rol": "admin",
    "activo": true,
    "fecha_registro": "..."
  }
}
```

**Interpretación:**
- Se obtiene un JWT que expira en 60 minutos
- El campo `rol: "admin"` permite acceder a endpoints de administración
- El token debe enviarse como `Authorization: Bearer <token>` en endpoints protegidos

**Nota:** Para probar como huésped, loguearse con otro usuario (ej: `ana.torres@example.com` / `Contrasena1`).

**Conclusión:**
El login funciona correctamente devolviendo token y datos del usuario.

---

## APIs Protegidas - Huésped (token requerido)

> En Postman, ir a pestaña **Authorization** → Type: `Bearer Token` → pegar el `access_token` obtenido del login.

---

### Prueba 6: Crear reserva

**Objetivo:**
Validar la creación de una nueva reserva por parte de un huésped autenticado.

**Procedimiento:**
- Método: `POST`
- URL: `http://localhost:8000/api/reservas`
- Headers: `Authorization: Bearer <token>` | `Content-Type: application/json`
- Body:
```json
{
  "habitacion_id": 1,
  "fecha_checkin": "2026-07-10",
  "fecha_checkout": "2026-07-12",
  "num_huespedes": 2
}
```

**Resultado esperado:**
```json
{
  "id": 4,
  "usuario_id": 2,
  "habitacion_id": 1,
  "fecha_checkin": "2026-07-10",
  "fecha_checkout": "2026-07-12",
  "num_huespedes": 2,
  "total": 240.0,
  "estado": "pendiente",
  "solicitudes_especiales": null,
  "fecha_creacion": "..."
}
```

**Interpretación:**
- La reserva se crea en estado `pendiente` hasta que se confirme el pago
- El `total` se calcula automáticamente (precio_noche * noches)

**Conclusión:**
La reserva se crea correctamente y queda pendiente de pago.

---

### Prueba 7: Ver mis reservas

**Objetivo:**
El huésped autenticado ve solo sus propias reservas.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/reservas/mis-reservas`
- Headers: `Authorization: Bearer <token_huesped>`

**Filtros opcionales (Params):**

| Key | Value |
|-----|-------|
| `estado` | `pendiente`, `activo`, `completado`, `cancelado` |
| `skip` | `0` |
| `limit` | `10` |

**Resultado esperado:**
```json
[
  {
    "id": 1,
    "habitacion_id": 1,
    "fecha_checkin": "2026-07-10",
    "fecha_checkout": "2026-07-12",
    "num_huespedes": 2,
    "total": 240.0,
    "estado": "pendiente",
    ...
  }
]
```

**Conclusión:**
Cada huésped ve únicamente sus reservas. No puede ver las de otros usuarios.

---

### Prueba 8: Cancelar reserva

**Objetivo:**
Cancelar una reserva propia.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/cancelar`
- Headers: `Authorization: Bearer <token>`

**Resultado esperado:**
```json
{
  "id": 1,
  "estado": "cancelado",
  ...
}
```

**Conclusión:**
La reserva cambia a estado `cancelado` y la habitación se libera automáticamente.

---


### Prueba 11: Ver mis pagos

**Objetivo:**
El huésped ve solo sus propios pagos.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/pagos/mis-pagos`
- Headers: `Authorization: Bearer <token_huesped>`

**Conclusión:**
Cada huésped ve únicamente sus pagos asociados a sus reservas.

---

## APIs Protegidas - Admin (token de admin requerido)

> Usar token del login con `admin1@hotelnova.com` / `Promocion135`.

---

### Prueba 12: Listar todas las reservas

**Objetivo:**
El administrador visualiza todas las reservas del sistema para gestionarlas.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/reservas`
- Headers: `Authorization: Bearer <token_admin>`

**Resultado esperado:**
```json
[
  {
    "id": 1,
    "usuario_id": 2,
    "habitacion_id": 1,
    "fecha_checkin": "2026-06-20",
    "fecha_checkout": "2026-06-22",
    "num_huespedes": 2,
    "total": 240.0,
    "estado": "activo",
    "solicitudes_especiales": null,
    "fecha_creacion": "..."
  },
  {
    "id": 2,
    "usuario_id": 3,
    "habitacion_id": 2,
    "fecha_checkin": "2026-06-21",
    "fecha_checkout": "2026-06-23",
    "num_huespedes": 2,
    "total": 240.0,
    "estado": "pendiente",
    ...
  }
]
```

**Interpretación de estados:**
- `"estado": "pendiente"` → esperando pago o aprobación
- `"estado": "activo"` → pagada y haciendo check-in
- `"estado": "completado"` → ya hizo checkout, estancia finalizada
- `"estado": "cancelado"` → fue cancelada, habitación liberada

**Conclusión:**
El admin puede monitorear todas las reservas y su estado en tiempo real.

---

### Prueba 13: Aprobar reserva

**Objetivo:**
El administrador aprueba una reserva pendiente.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/aprobar`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
La reserva pasa de `pendiente` a `activo`.


---


### Prueba 18: Listar usuarios

**Objetivo:**
Validar que el administrador puede ver todos los usuarios registrados.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/usuarios`
- Headers: `Authorization: Bearer <token_admin>`

**Resultado esperado:**
```json
[
  {
    "id": 1,
    "dni": null,
    "nombre": "Admin Hotel Nova",
    "email": "admin1@hotelnova.com",
    "rol": "admin",
    "activo": true,
    "fecha_registro": "..."
  },
  {
    "id": 2,
    "dni": "74314540",
    "nombre": "RAMOS FLORES, JUNIOR ALFREDO",
    "email": "ana.torres@example.com",
    "rol": "huesped",
    "activo": true,
    "fecha_registro": "..."
  },
  {
    "id": 3,
    "dni": "87654321",
    "nombre": "Luis Perez",
    "email": "luis.perez@example.com",
    "rol": "huesped",
    "activo": true,
    "fecha_registro": "..."
  }
]
```

**Interpretación:**
Solo el admin puede acceder. Si un usuario sin token o sin rol admin intenta acceder, devuelve `"detail": "Not authenticated"`.

**Conclusión:**
Endpoint protegido correctamente. Solo administradores pueden gestionar usuarios.

---

### Prueba 19: Ver pagos (admin)

**Objetivo:**
El administrador visualiza todos los pagos registrados.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/pagos`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
Endpoint para que el admin monitoree los pagos del sistema.

---

### Prueba 20: Resumen de pagos del mes

**Objetivo:**
Ver el total recaudado en el mes actual.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/pagos/resumen/mes-actual`
- Headers: `Authorization: Bearer <token_admin>`

**Resultado esperado:**
```json
{
  "cantidad": 5,
  "total": 15000.0
}
```

**Conclusión:**
Endpoint funcional para reportes financieros mensuales.

---

### Prueba 23: Eliminar habitación (admin)

**Objetivo:**
Eliminar una habitación del sistema.

**Procedimiento:**
- Método: `DELETE`
- URL: `http://localhost:8000/api/habitaciones/1`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
Endpoint funcional para eliminar habitaciones.

---

## Resumen de accesos

| Tipo | Autenticación | Pruebas |
|------|---------------|---------|
| **Público** | Sin token | 1 a 5 (DNI, habitaciones, registro, login) |
| **Huésped** | Token JWT | 6 a 11 (reservas, reseñas, pagos propios) |
| **Admin** | Token JWT + rol admin | 12 a 23 (gestionar reservas, dashboard, usuarios, CRUD habitaciones) |
