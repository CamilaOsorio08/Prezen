# Documentación del Proyecto Prezen

## 1. Introducción

Bienvenido a la documentación oficial del proyecto web "Prezen" (Asistencia Institucional). 
Este documento contiene la descripción detallada, la estructura real del proyecto y los datos de acceso para pruebas (usuarios demo).

## 2. Tecnologías del Proyecto

El proyecto utiliza las siguientes tecnologías:
- **HTML5**: Estructura semántica de las interfaces.
- **CSS3**: Diseño visual premium (Glassmorphism, animaciones, responsividad).
- **JavaScript (JS)**: Gestión de la interfaz y llamadas HTTP a la API.
- **Node.js y Express**: API REST, controladores, autenticación y autorización por rol.
- **Supabase**: Base de datos y Auth; solo se accede desde el backend.

## 3. Estructura del Proyecto Actualizada

A diferencia de las etapas iniciales, el proyecto ya cuenta con una base de código funcional:

- **`public/`**:
  - **`auth/`**: Contiene las páginas de acceso y registro.
    - `index.html`: Pantalla principal de login.
    - `welcome.html`: Pantalla de transición post-login.
    - `dashboard.html`: Vista general predeterminada.
    - `assets/js/script.js`: Formulario de autenticación contra la API.
  - **`panel_control/`**: Dashboards específicos por rol.
    - `admin/`: Panel para administradores.
    - `coordinadores/`: Panel con funcionalidades de toma de asistencia y escaneo QR.
    - `directores_grupo/`: Panel para directores de curso.
    - `estudiantes/`: Panel de consulta para alumnos.
    - `padres_familia/`: Panel para seguimiento de acudientes.
  - **`assets/`**: Recursos globales (CSS, imágenes, JS).

- **`src/`**: API Express, controladores, servicios, migraciones SQL y seed demo.

## 4. Inicio local y usuarios demo

Configura `src/.env` usando `src/.env.example`, aplica en Supabase las migraciones `0001` a `0005`, configura `DEMO_PASSWORD`, ejecuta `npm run db:seed` y luego `npm run dev` desde `src/`. Abre `http://localhost:3000/auth/index.html`. La contraseña demo es local y configurable; no se incluye una contraseña real en el repositorio.

El seed crea `admin@prezen.demo`, `coordinador@prezen.demo`, `director@prezen.demo`, `padre@prezen.demo` y `estudiante01@prezen.demo` a `estudiante28@prezen.demo`. Todas las cuentas nuevas usan el valor configurado en `DEMO_PASSWORD`.

El seed puede repetirse; no reemplaza asistencias existentes ni cambia la asignación de un grupo que pertenezca a otro director. Requiere URL, llaves y base Supabase configuradas correctamente.

## 5. Funcionalidades Principales

1.  **Autenticación**: Login con Supabase Auth a través de la API; token y perfil por rol.
2.  **Transición Cinematográfica**: Pantalla de `welcome.html` con spinner de carga antes de entrar al panel.
3.  **Toma de Asistencia (Coordinadores)**: 
    - Escaneo de código QR (integrado con `Html5Qrcode`).
    - Registro manual de asistencia.
    - Registro de asistencia QR/manual persistido por la API.
4.  **Dashboards Responsivos**: Sidebar colapsable y diseño adaptado a dispositivos móviles.
5.  **Datos por rol**: Endpoint de dashboard que limita estudiantes y asistencia según usuario, matrícula, acudiente o grupo asignado.
6.  **Reportes**: Filtro de mes/semana/período consultado desde registros de asistencia.
7.  **Comunicaciones**: Mensajes internos persistidos para acudientes; no se envían correos externos sin proveedor SMTP.

El contrato y catálogo completo de endpoints están en el `README.md` de la raíz del proyecto.
