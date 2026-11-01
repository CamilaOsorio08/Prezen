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

    // ---- Autenticación real mediante la API PREZEN ----
    const loginForm = document.getElementById('loginForm');
    const localDemoButton = document.getElementById('localDemoLogin');
    if (localDemoButton) {
        localDemoButton.addEventListener('click', async () => {
            const spinner = document.getElementById('cinematic-spinner');
            if (spinner) spinner.classList.remove('hidden');
            localDemoButton.disabled = true;
            try {
                const result = await window.PrezenAPI.loginLocalDemo(
                    document.getElementById('remember').checked
                );
                if (!result.profile || result.profile.rol !== 'director_grupo') {
                    throw new Error('No se pudo iniciar el perfil local de director.');
                }
                window.location.href = '/panel_control/directores_grupo/index.html';
            } catch (error) {
                let errorMessage = document.getElementById('loginError');
                if (!errorMessage) {
                    errorMessage = document.createElement('p');
                    errorMessage.id = 'loginError';
                    errorMessage.setAttribute('role', 'alert');
                    errorMessage.setAttribute('aria-live', 'polite');
                    errorMessage.style.cssText = 'color:#b91c1c;margin:12px 0 0;font-size:14px;';
                    loginForm.appendChild(errorMessage);
                }
                errorMessage.textContent = error.message;
                if (spinner) spinner.classList.add('hidden');
                localDemoButton.disabled = false;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const spinner = document.getElementById('cinematic-spinner');
            if (spinner) {
                spinner.classList.remove('hidden');
            }
            const submitButton = loginForm.querySelector('[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            let errorMessage = document.getElementById('loginError');
            if (!errorMessage) {
                errorMessage = document.createElement('p');
                errorMessage.id = 'loginError';
                errorMessage.setAttribute('role', 'alert');
                errorMessage.setAttribute('aria-live', 'polite');
                errorMessage.style.cssText = 'color:#b91c1c;margin:12px 0 0;font-size:14px;';
                loginForm.appendChild(errorMessage);
            }
            errorMessage.textContent = '';
            try {
                const result = await window.PrezenAPI.login(
                    document.getElementById('email').value.trim(),
                    document.getElementById('password').value,
                    document.getElementById('remember').checked
                );
                const destinations = {
                    admin: '/auth/dashboard.html',
                    coordinador: '/panel_control/coordinadores/index.html',
                    director_grupo: '/panel_control/directores_grupo/index.html',
                    padre_familia: '/panel_control/padres_familia/index.html',
                    estudiante: '/panel_control/estudiantes/index.html',
                };
                const redirectUrl = destinations[result.profile.rol] || '/auth/index.html';
                window.location.href = `/auth/welcome.html?name=${encodeURIComponent(result.profile.nombre)}&redirect=${encodeURIComponent(redirectUrl)}`;
            } catch (error) {
                errorMessage.textContent = error.message;
                if (spinner) spinner.classList.add('hidden');
                if (submitButton) submitButton.disabled = false;
            }
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
