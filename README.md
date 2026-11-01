# PREZEN

Aplicación web de seguimiento de asistencia con frontend estático en `public/`, API Node/Express en `src/` y Supabase como almacenamiento. El navegador se comunica con la API; solo el backend usa la llave de servicio de Supabase.

## Estructura de la aplicación

- `public/`: vistas HTML, estilos y JavaScript del navegador. El cliente compartido `public/assets/js/prezen-api.js` consume `/api/v1`; las páginas no acceden directamente a Supabase.
- `src/app/routes/`: declara endpoints y autenticación/autorización por rol.
- `src/app/controllers/`: valida solicitudes, coordina los modelos y serializa las respuestas HTTP.
- `src/app/models/`: acceso a datos por dominio (`auth`, `users`, `groups`, `attendance`, `sessions`, `notifications`, `periods`, `communications`, `admin`, salud de base de datos y almacenamiento de fotos).
- `src/app/services/`: reglas de negocio para asistencia y sesiones.
- `src/bd/migracion/`: esquema y migraciones de Supabase.

Las respuestas de la API mantienen el contrato `{ success, data }` o `{ success: false, error }`, utilizado por el frontend para actualizar vistas y mostrar errores.

## Configuración local

1. Copia `src/.env.example` a `src/.env` y configura los valores del proyecto Supabase. No publiques `src/.env` ni compartas la `SUPABASE_SERVICE_ROLE_KEY`.
2. Ejecuta en el editor SQL de Supabase, en orden, las migraciones `src/bd/migracion/0001_roles_usuarios.sql` a `0005_perfil_periodos_mensajes.sql`.
3. Desde `src/`, instala dependencias con `npm install`.
4. Define `DEMO_PASSWORD` en `src/.env` con una contraseña de prueba de al menos 8 caracteres. El seed usa esa contraseña para las cuentas demo nuevas.
5. Desde `src/`, ejecuta `npm run db:seed` para crear o completar los datos demo.
6. Inicia el servidor con `npm run dev` y abre `http://localhost:3000`. Express sirve el frontend de `public/` y la API en el mismo servidor; la ruta raíz redirige a la pantalla de acceso.

El seed se puede repetir: conserva cuentas/matrículas existentes, inserta solo asistencias que falten y no reasigna un grupo que ya pertenezca a otro director. El seed no modifica datos reales de asistencia ya registrados. Para producción, no uses cuentas ni contraseña demo.

## Mostrar el dashboard de director sin base de datos

Para una presentación, sirve la carpeta `public/` con una extensión como Live Server de VS Code y abre `/auth/index.html`. En la pantalla de acceso, selecciona **Entrar al demo local (sin base de datos)**. No necesitas iniciar la API, configurar Supabase ni ingresar una contraseña.

El modo local abre el panel de director con estudiantes, asistencia, reportes y comunicaciones de muestra. Los cambios de perfil y mensajes se guardan en el almacenamiento local del navegador y no se envían a Supabase. Esta opción es solo para demostraciones; el inicio de sesión normal conserva su conexión habitual.

## Cuentas demo

Las cuentas creadas son `admin@prezen.demo`, `coordinador@prezen.demo`, `director@prezen.demo`, `padre@prezen.demo` y `estudiante01@prezen.demo` a `estudiante28@prezen.demo`. Todas las cuentas nuevas usan el valor local de `DEMO_PASSWORD`.

## API v1

Todas las respuestas siguen `{ "success": true, "data": ... }` o `{ "success": false, "error": { "code": "...", "message": "..." } }`. Excepto salud y autenticación/renovación, los endpoints requieren `Authorization: Bearer <access_token>`.

| Método | Endpoint | Acceso |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Público |
| `GET` | `/api/v1/health/db` | Público |
| `POST` | `/api/v1/auth/login` | Público; recibe `email`, `password` |
| `POST` | `/api/v1/auth/refresh` | Público; recibe `refresh_token` |
| `GET` | `/api/v1/auth/me` | Usuario autenticado |
| `PATCH` | `/api/v1/auth/me` | Usuario autenticado; teléfono/avatar URL |
| `POST` | `/api/v1/auth/me/avatar` | Usuario autenticado; foto PNG/JPEG/WebP hasta 3 MB |
| `GET` | `/api/v1/dashboard` | Todos los roles; datos filtrados por perfil/asignación |
| `GET` | `/api/v1/reports?month=YYYY-MM&period=1&week=1` | Admin y director; mes, período y semana opcionales |
| `GET` | `/api/v1/contacts` | Admin, coordinador y director |
| `GET`, `POST` | `/api/v1/messages` | Lectura autenticada; envío para admin/coordinador/director |
| `PATCH` | `/api/v1/notifications/read` | Usuario autenticado; solo sus notificaciones |
| `POST` | `/api/v1/sesiones` | Coordinador; abre sesión de asistencia |
| `GET` | `/api/v1/sesiones/actual?grupo_id=1` | Coordinador/admin |
| `PATCH` | `/api/v1/sesiones/:id/cerrar` | Coordinador asignado/admin |
| `POST` | `/api/v1/asistencia/qr` | Coordinador asignado |
| `POST` | `/api/v1/asistencia/manual` | Coordinador asignado |
| `GET` | `/api/v1/admin/stats` | Admin |

Los mensajes se guardan en la base de datos; el envío de correo electrónico externo requiere configurar un proveedor SMTP/transaccional y no se simula como exitoso. El uso de Storage de Supabase para fotos crea el bucket público `profile-avatars` al primer uso.
