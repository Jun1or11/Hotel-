# Pruebas Postman - Hotel Nova API

Este documento contiene las pruebas funcionales de la API de **Hotel Nova** realizadas con **Postman**. Sirve como guía para validar que cada endpoint del sistema funciona correctamente antes de ponerlo en producción.

**¿Para qué nos sirve?**
- Verificar que los endpoints públicos (registro, login, consulta DNI, listar habitaciones) responden sin necesidad de autenticación.
- Probar los endpoints protegidos de huésped (crear/ver/cancelar reservas, ver pagos) usando tokens JWT.
- Probar los endpoints de administrador (gestionar reservas, usuarios, habitaciones, dashboard).
- Detectar errores de validación, permisos o lógica de negocio antes de que lleguen a usuarios reales.

---



## Tabla rápida de endpoints

| Método | Endpoint | Tipo | Descripción |
|--------|----------|------|-------------|
| GET | `/api/auth/dni/{dni}` | 🔓 Pública | Consultar DNI en ApiPeru |
| GET | `/api/habitaciones` | 🔓 Pública | Listar habitaciones |
| POST | `/api/auth/register` | 🔓 Pública | Registrar usuario |
| POST | `/api/auth/login` | 🔓 Pública | Iniciar sesión |
| POST | `/api/reservas` | 🔐 Huésped | Crear reserva |
| GET | `/api/reservas/mis-reservas` | 🔐 Huésped | Ver mis reservas |
| PUT | `/api/reservas/{id}/cancelar` | 🔐 Huésped | Cancelar mi reserva |
| GET | `/api/pagos/mis-pagos` | 🔐 Huésped | Ver mis pagos |
| GET | `/api/reservas` | 🔐 Admin | Listar todas las reservas |
| PUT | `/api/reservas/{id}/aprobar` | 🔐 Admin | Aprobar reserva |
| GET | `/api/usuarios` | 🔐 Admin | Listar usuarios |
| GET | `/api/pagos` | 🔐 Admin | Ver todos los pagos |
| GET | `/api/pagos/resumen/mes-actual` | 🔐 Admin | Resumen pagos del mes |
| POST | `/api/habitaciones` | 🔐 Admin | Crear habitación |
| PUT | `/api/habitaciones/{id}` | 🔐 Admin | Actualizar habitación |
| DELETE | `/api/habitaciones/{id}` | 🔐 Admin | Eliminar habitación |
| GET | `/api/usuarios/{id}` | 🔐 Admin | Ver detalle de usuario |
| PUT | `/api/usuarios/{id}` | 🔐 Admin | Actualizar usuario |
| DELETE | `/api/usuarios/{id}` | 🔐 Admin | Eliminar usuario |
| PUT | `/api/reservas/{id}/checkin` | 🔐 Admin | Hacer check-in |
| PUT | `/api/reservas/{id}/checkout` | 🔐 Admin | Hacer check-out |
| PUT | `/api/reservas/{id}/completar` | 🔐 Admin | Completar reserva |
| PUT | `/api/reservas/{id}/liberar` | 🔐 Admin | Liberar habitación |
| PUT | `/api/reservas/{id}/cancelar` | 🔐 Admin | Cancelar cualquier reserva |
| POST | `/api/pagos` | 🔐 Admin | Crear pago manual |
| GET | `/api/dashboard/stats` | 🔐 Admin | Estadísticas del dashboard |
| GET | `/api/dashboard/habitaciones-populares` | 🔐 Admin | Ranking habitaciones populares |
| GET | `/api/dashboard/resenas` | 🔐 Admin | Reseñas para dashboard |
| GET | `/api/notificaciones/enviadas` | 🔐 Admin | Historial de notificaciones enviadas |
| POST | `/api/notificaciones/enviar` | 🔐 Admin | Enviar notificación (individual o masiva) |
 
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

### Prueba 24: Eliminar usuario (admin)

**Objetivo:**
Eliminar un usuario del sistema.

**Procedimiento:**
- Método: `DELETE`
- URL: `http://localhost:8000/api/usuarios/5`
- Headers: `Authorization: Bearer <token_admin>`

**Resultado esperado:**
```json
{
  "message": "Usuario eliminado"
}
```

**Conclusión:**
Endpoint funcional para eliminar usuarios.

---

### Prueba 25: Cancelar reserva como admin

**Objetivo:**
El administrador cancela cualquier reserva y se notifica automáticamente al huésped.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/cancelar`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
La reserva cambia a `cancelado`, la habitación se libera y el huésped recibe una notificación.

---

### Prueba 26: Check-in de reserva (admin)

**Objetivo:**
Registrar la llegada del huésped y marcar la habitación como ocupada.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/checkin`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
La reserva pasa a `activo` y la habitación cambia a `ocupado`.

---

### Prueba 27: Check-out de reserva (admin)

**Objetivo:**
Registrar la salida del huésped y liberar la habitación.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/checkout`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
La reserva pasa a `completado` y la habitación vuelve a `libre`.

---

### Prueba 28: Completar reserva por fecha (admin)

**Objetivo:**
Marcar una reserva como completada cuando ya pasó su fecha de salida.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/completar`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
Útil para limpiar reservas activas cuya fecha de checkout ya venció.

---

### Prueba 29: Liberar habitación por salida anticipada (admin)

**Objetivo:**
Liberar la habitación cuando el huésped se va antes de tiempo.

**Procedimiento:**
- Método: `PUT`
- URL: `http://localhost:8000/api/reservas/1/liberar`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
Misma lógica que completar, pero pensada para salidas anticipadas.

---

### Prueba 30: Dashboard - Estadísticas (admin)

**Objetivo:**
Obtener métricas principales del dashboard administrativo.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/dashboard/stats`
- Headers: `Authorization: Bearer <token_admin>`

**Resultado esperado:**
```json
{
  "total_habitaciones": 16,
  "ocupadas_hoy": 3,
  "reservas_pendientes": 5,
  "ingresos_mes": 12500.0
}
```

**Conclusión:**
Endpoint funcional para el panel de control del admin.

---

### Prueba 31: Dashboard - Habitaciones populares (admin)

**Objetivo:**
Ver ranking de las habitaciones más reservadas.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/dashboard/habitaciones-populares?limit=5`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
Endpoint funcional para identificar las habitaciones más demandadas.

---

### Prueba 32: Dashboard - Reseñas (admin)

**Objetivo:**
Ver promedio de puntuación y reseñas recientes.

**Procedimiento:**
- Método: `GET`
- URL: `http://localhost:8000/api/dashboard/resenas?limit=5`
- Headers: `Authorization: Bearer <token_admin>`

**Conclusión:**
Endpoint funcional para monitorear la satisfacción de los huéspedes.

---

### Prueba 33: Enviar notificación como admin

**Objetivo:**
El administrador envía una notificación a un huésped específico o a todos.

**Procedimiento (individual):**
- Método: `POST`
- URL: `http://localhost:8000/api/notificaciones/enviar`
- Headers: `Authorization: Bearer <token_admin>` | `Content-Type: application/json`
- Body:
```json
{
  "destinatario": "single",
  "usuario_id": 2,
  "mensaje": "Tu habitación está lista.",
  "plantilla": "personalizada"
}
```

**Procedimiento (masivo):**
```json
{
  "destinatario": "all",
  "mensaje": "Recordatorio: check-out es a las 12:00 pm.",
  "plantilla": "estadia_hoy"
}
```

**Conclusión:**
Endpoint funcional para comunicación con huéspedes.

---

## Resumen de accesos

| Tipo | Autenticación | Pruebas |
|------|---------------|---------|
| **Público** | Sin token | 1 a 5 (DNI, habitaciones, registro, login) |
| **Huésped** | Token JWT | 6 a 11 (reservas, reseñas, pagos propios) |
| **Admin** | Token JWT + rol admin | 12 a 33 (gestionar reservas, dashboard, usuarios, CRUD habitaciones, notificaciones) |
