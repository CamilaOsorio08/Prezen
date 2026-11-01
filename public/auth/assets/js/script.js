document.addEventListener('DOMContentLoaded', () => {
    // ---- Toggle Password Visibility ----
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

            // Cambiamos la clase del ícono
            if (isPassword) {
                togglePassword.classList.replace('fa-eye-slash', 'fa-eye');
            } else {
                togglePassword.classList.replace('fa-eye', 'fa-eye-slash');
            }
        });
    }

    // ---- Animaciones dinámicas en los inputs ----
    const inputs = document.querySelectorAll('.input-group input');

    inputs.forEach(input => {
        // Efecto levitar suave al hacer focus
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'translateY(-3px)';
            input.parentElement.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });

        // Vuelve a su lugar al quitar el focus
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'translateY(0)';
        });
    });

    // ---- Prevención de envío de form (Mockup) ----
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email').value.trim() || '';
            
            // Define users and roles
            const users = {
                'admin@gmail.com': { name: 'Admin', redirect: 'dashboard.html' },
                'coordinador@gmail.com': { name: 'Coordinador', redirect: '../panel_control/coordinadores/index.html' },
                'director@gmail.com': { name: 'Director', redirect: '../panel_control/directores_grupo/index.html' },
                'padre@gmail.com': { name: 'Padre', redirect: '../panel_control/padres_familia/index.html' },
                'estudiante@gmail.com': { name: 'Estudiante', redirect: '../panel_control/estudiantes/index.html' }
            };

            let userName = "Usuario";
            let redirectUrl = "dashboard.html";

            if (users[emailInput]) {
                userName = users[emailInput].name;
                redirectUrl = users[emailInput].redirect;
            } else {
                let namePart = emailInput.split('@')[0];
                if (namePart) {
                    userName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                }
            }

            // Mostrar spinner cinematográfico
            const spinner = document.getElementById('cinematic-spinner');
            if (spinner) {
                spinner.classList.remove('hidden');
            }

            // Simular tiempo de carga de 3 segundos
            setTimeout(() => {
                // Redirigir a pantalla de bienvenida con el nombre y la url de destino
                window.location.href = `welcome.html?name=${encodeURIComponent(userName)}&redirect=${encodeURIComponent(redirectUrl)}`;
            }, 3000);
        });
    }

    // ---- Efecto de círculos animados desde abajo hacia arriba ----
    function createParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;

        const particleCount = 45; // Número de círculos

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            // Posicionamiento aleatorio en X
            const posX = Math.random() * 100;

            // Tamaño aleatorio fijo por círculo (entre 30px y 180px para simular la imagen)
            const size = Math.random() * 150 + 30;

            // Duración y retraso de animación aleatorios
            const duration = Math.random() * 20 + 20; // 20s a 40s
            // Un delay negativo permite que ya haya partículas distribuidas en pantalla al cargar
            const delay = Math.random() * 40;

            // Opacidad fija por círculo (sin cambiar), azul característico como la referencia
            const opacity = Math.random() * 0.4 + 0.1;

            particle.style.cssText = `
                position: absolute;
                left: ${posX}vw;
                top: 100vh;
                width: ${size}px;
                height: ${size}px;
                background-color: rgba(30, 144, 255, ${opacity});
                border-radius: 50%;
                pointer-events: none;
                animation: floatUp ${duration}s infinite linear;
                animation-delay: -${delay}s;
            `;

            container.appendChild(particle);
        }
    }

    createParticles();
});
