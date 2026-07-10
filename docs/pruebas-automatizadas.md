# Pruebas Automatizadas con Selenium - Hotel Nova

## Introducción

Se implementaron pruebas automatizadas para el backend de **Hotel Nova** utilizando **pytest** como framework principal. Se cubren tres niveles de prueba: unitarias, integración y E2E con Selenium, asegurando desde la lógica individual hasta los flujos completos del usuario en el navegador.

---

## 1. Pruebas Unitarias

Validan la lógica de negocio a nivel de funciones individuales sin depender del servidor HTTP ni de base de datos real (usa SQLite en memoria).

**Comando:**
```powershell
cd backend
.\tests\run_unit.ps1
```

**Lo que ejecutan:**
- **Modelos**: valores por defecto (rol huésped, estado libre, pendiente, etc.), constraints (DNI nullable, reseña única por usuario)
- **Seguridad**: hasheo de contraseñas con bcrypt, creación y verificación de JWT, expiración de tokens, rate-limiting de intentos de login
- **CRUD Usuarios**: crear, buscar por email/ID, listar, actualizar nombre, eliminar — incluyendo errores por duplicado o inexistente
- **CRUD Habitaciones**: crear, listar, filtrar por tipo, actualizar precio, eliminar — incluyendo número duplicado
- **CRUD Reservas**: crear, detección de superposición de fechas (overlap), calcular total automático, actualizar estado, eliminar

| Archivo | Pruebas | ¿Qué valida? |
|---------|---------|--------------|
| `test_models.py` | 13 | Valores por defecto de modelos y constraints |
| `test_security.py` | 12 | Hasheo bcrypt, JWT, rate-limiting |
| `test_crud_usuarios.py` | 10 | CRUD completo de usuarios |
| `test_crud_habitaciones.py` | 10 | CRUD de habitaciones + filtros |
| `test_crud_reservas.py` | 14 | CRUD de reservas + detección de overlap |
| **Total** | **59** | |

---

## 2. Pruebas de Integración

Validan los endpoints de la API REST usando el TestClient de FastAPI, con autenticación real (JWT) y base de datos SQLite temporal. **No requiere servidor encendido.**

**Comando:**
```powershell
cd backend
.\tests\run_integration.ps1
```

**Lo que ejecutan:**
- **Auth**: registro con validación de DNI, login, obtener perfil propio, actualizar perfil
- **Habitaciones**: listar (público), crear/editar/eliminar (admin), filtrar por tipo
- **Reservas**: crear con cálculo automático de total, rechazar superposición, cancelar (propia), listar mis reservas, admin ve todas
- **Reseñas**: crear, actualizar (upsert), ver reseña propia
- **Notificaciones**: listar, marcar como leídas, limpiar, enviar individual/masiva (admin)
- **Admin/Pagos**: dashboard (stats, habitaciones populares, reseñas), CRUD de usuarios, pagos (mis pagos, resumen del mes)

| Archivo | ¿Qué valida? |
|---------|--------------|
| `test_api_auth.py` | Register, login, perfil |
| `test_api_habitaciones.py` | CRUD + filtros de habitaciones |
| `test_api_reservas.py` | Crear, cancelar, listar reservas |
| `test_api_resenas.py` | Crear y consultar reseñas |
| `test_api_notificaciones.py` | CRUD de notificaciones + envío |
| `test_api_admin.py` | Dashboard, usuarios, pagos |

**Total: 56 pruebas**

---

## 3. Pruebas E2E con Selenium

Validan flujos completos de usuario en un navegador Chrome real, automatizado con Selenium y el patrón Page Object Model. **Requiere backend y frontend corriendo**, además de Chrome instalado.

**Lo que ejecutan:**
- **Auth**: registro de nuevo usuario con consulta DNI, login como admin (redirige a /admin), login como huésped (redirige a /habitaciones), logout, actualización de perfil
- **Reservas**: navegar habitaciones, filtrar por tipo "Suite", seleccionar fechas en calendario, llenar formulario de reserva con huéspedes y solicitudes, confirmar, ver reserva en "Mis Reservas", cancelar reserva pendiente
- **Admin**: dashboard carga con KPIs (habitaciones, ocupación, ingresos), crear habitación con número aleatorio, editar precio de habitación, eliminar habitación, ver listado de reservas, ver listado de usuarios

| Comando | ¿Qué ejecuta? |
|---------|--------------|
| `.\tests\e2e\run_tests.ps1` | Todas las pruebas E2E (14 pruebas) |
| `.\tests\e2e\run_tests.ps1 -Tests "auth"` | Solo pruebas de autenticación (5 pruebas) |
| `.\tests\e2e\run_tests.ps1 -Headless` | Mismas 14 pruebas, Chrome en segundo plano sin ventana |

| Archivo | Pruebas | ¿Qué valida? |
|---------|---------|--------------|
| `test_auth.py` | 5 | Registro con consulta DNI, login admin/guest, logout, update profile |
| `test_booking_flow.py` | 3 | Filtrar habitaciones, crear reserva, cancelar reserva |
| `test_admin_flows.py` | 6 | Dashboard, CRUD habitaciones, listar reservas y usuarios |
| **Total** | **14** | |

---

## Resumen

| Tipo | Comando | ¿Requiere servidores? |
|------|---------|----------------------|
| Unitarias | `cd backend; .\tests\run_unit.ps1` | No |
| Integración | `cd backend; .\tests\run_integration.ps1` | No |
| E2E (Selenium) | `.\tests\e2e\run_tests.ps1` | Sí (backend + frontend) |

## Evidencias

[agregar capturas de los comandos ejecutándose]
