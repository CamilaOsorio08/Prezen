# Documentación del Proyecto Prezen

## 1. Introducción

Bienvenido a la documentación oficial del proyecto web "Prezen" (Asistencia Institucional). 
Este documento contiene la descripción detallada, la estructura real del proyecto y los datos de acceso para pruebas (usuarios demo).

## 2. Tecnologías del Proyecto

El proyecto utiliza las siguientes tecnologías:
- **HTML5**: Estructura semántica de las interfaces.
- **CSS3**: Diseño visual premium (Glassmorphism, animaciones, responsividad).
- **JavaScript (JS)**: Lógica de autenticación, gestión del DOM, y funcionalidades interactivas (Escaneo QR, toggles, navegación SPA).

## 3. Estructura del Proyecto Actualizada

A diferencia de las etapas iniciales, el proyecto ya cuenta con una base de código funcional:

- **`public/`**:
  - **`auth/`**: Contiene las páginas de acceso y registro.
    - `index.html`: Pantalla principal de login.
    - `welcome.html`: Pantalla de transición post-login.
    - `dashboard.html`: Vista general predeterminada.
    - `assets/js/script.js`: Lógica de autenticación vinculada a los usuarios demo.
  - **`panel_control/`**: Dashboards específicos por rol.
    - `admin/`: Panel para administradores.
    - `coordinadores/`: Panel con funcionalidades de toma de asistencia y escaneo QR.
    - `directores_grupo/`: Panel para directores de curso.
    - `estudiantes/`: Panel de consulta para alumnos.
    - `padres_familia/`: Panel para seguimiento de acudientes.
  - **`assets/`**: Recursos globales (CSS, imágenes, JS).

- **`src/`**: Reservado para la lógica de backend, hooks y componentes modulares en futuras integraciones.

## 4. Usuarios Demo (Credenciales de Prueba)

Para facilitar las pruebas de los diferentes roles en el sistema, se han definido los siguientes usuarios en la lógica de `public/auth/assets/js/script.js`:

| Rol | Correo Electrónico | Contraseña sugerida | Redirección |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@gmail.com` | (Cualquiera) | `dashboard.html` |
| **Coordinador** | `coordinador@gmail.com` | (Cualquiera) | `panel_control/coordinadores/` |
| **Director de Grupo** | `director@gmail.com` | (Cualquiera) | `panel_control/directores_grupo/` |
| **Padre de Familia** | `padre@gmail.com` | (Cualquiera) | `panel_control/padres_familia/` |
| **Estudiante** | `estudiante@gmail.com` | (Cualquiera) | `panel_control/estudiantes/` |

> [!NOTE]
> Actualmente, la autenticación es un "mockup". Cualquier correo ingresado funcionará, pero los específicos listados arriba redirigirán a sus paneles correspondientes.

## 5. Funcionalidades Principales

1.  **Autenticación Visual**: Interfaz de login con efectos de partículas y validación simulada.
2.  **Transición Cinematográfica**: Pantalla de `welcome.html` con spinner de carga antes de entrar al panel.
3.  **Toma de Asistencia (Coordinadores)**: 
    - Escaneo de código QR (integrado con `Html5Qrcode`).
    - Registro manual de asistencia.
    - Visualización de logs en tiempo real.
4.  **Dashboards Responsivos**: Sidebar colapsable y diseño adaptado a dispositivos móviles.
