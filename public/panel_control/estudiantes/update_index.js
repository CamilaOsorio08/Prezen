const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update nav links
content = content.replace(/>\s*<i class="fa-solid fa-house"><\/i> <span>Inicio<\/span>/g, ' data-target="view-inicio">\n                            <i class="fa-solid fa-house"></i> <span>Inicio</span>');
content = content.replace(/>\s*<i class="fa-regular fa-calendar-check"><\/i> <span>Asistencia<\/span>/g, ' data-target="view-asistencia">\n                            <i class="fa-regular fa-calendar-check"></i> <span>Asistencia</span>');
content = content.replace(/>\s*<i class="fa-regular fa-calendar"><\/i> <span>Reportes<\/span>/g, ' data-target="view-reportes">\n                            <i class="fa-regular fa-calendar"></i> <span>Reportes</span>');
content = content.replace(/>\s*<i class="fa-regular fa-clock"><\/i> <span>Horario<\/span>/g, ' data-target="view-horario">\n                            <i class="fa-regular fa-clock"></i> <span>Horario</span>');
content = content.replace(/>\s*<i class="fa-solid fa-chart-line"><\/i> <span>Reportes Detallados<\/span>/g, ' data-target="view-reportes-detallados">\n                            <i class="fa-solid fa-chart-line"></i> <span>Reportes Detallados</span>');
content = content.replace(/>\s*<i class="fa-solid fa-chalkboard-user"><\/i> <span>Profesores<\/span>/g, ' data-target="view-profesores">\n                            <i class="fa-solid fa-chalkboard-user"></i> <span>Profesores</span>');

// 2. Update profile dropdown links
content = content.replace(/class="dropdown-item" style="display:flex/g, 'class="dropdown-item nav-link" style="display:flex');

// Specifically handle Mi Perfil and Configuración
content = content.replace(/nav-link" style="display:flex; align-items:center; gap:12px; padding:10px 20px; color:#1e293b; text-decoration:none; font-size:0.9rem; font-weight:500; transition:background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">\n                                    <i class="fa-regular fa-user"/g, 'nav-link" data-target="view-perfil" style="display:flex; align-items:center; gap:12px; padding:10px 20px; color:#1e293b; text-decoration:none; font-size:0.9rem; font-weight:500; transition:background 0.2s;" onmouseover="this.style.background=\\\'#f1f5f9\\\'" onmouseout="this.style.background=\\\'transparent\\\'">\n                                    <i class="fa-regular fa-user"');
content = content.replace(/nav-link" style="display:flex; align-items:center; gap:12px; padding:10px 20px; color:#1e293b; text-decoration:none; font-size:0.9rem; font-weight:500; transition:background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">\n                                    <i class="fa-solid fa-gear"/g, 'nav-link" data-target="view-configuraciones" style="display:flex; align-items:center; gap:12px; padding:10px 20px; color:#1e293b; text-decoration:none; font-size:0.9rem; font-weight:500; transition:background 0.2s;" onmouseover="this.style.background=\\\'#f1f5f9\\\'" onmouseout="this.style.background=\\\'transparent\\\'">\n                                    <i class="fa-solid fa-gear"');

// Ensure Logout link is NOT a nav-link matching data-target SPA logic
content = content.replace(/class="dropdown-item nav-link" style="display:flex; align-items:center; gap:12px; padding:10px 20px; color:#ef4444;/g, 'class="dropdown-item" style="display:flex; align-items:center; gap:12px; padding:10px 20px; color:#ef4444;');

// 3. Wrap main content with view-secion
content = content.replace(/<header class="top-header">/, '<div id="view-inicio" class="view-section active">\n            <header class="top-header">');
content = content.replace(/<footer class="dashboard-footer">/, `</div>

            <!-- Additional Views Container -->
            <!-- PERFIL -->
            <div id="view-perfil" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                        <h1>MI PERFIL</h1>
                        <h2>Información personal y de contacto</h2>
                    </div>
                </header>
                <div class="tables-container" style="grid-template-columns: 1fr; margin-top:20px;">
                    <div class="table-card">
                        <h3 class="card-title">Datos Personales</h3>
                        <div style="display:flex; flex-direction:column; gap:20px;">
                            <div style="display:flex; align-items:center; gap:24px; margin-bottom:10px;">
                                <img src="https://ui-avatars.com/api/?name=Maria+Escobedo&background=random&color=fff" alt="Perfil" style="width:80px; height:80px; border-radius:50%; object-fit:cover; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                                <button class="btn" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#334155;">Cambiar Foto</button>
                            </div>
                            <div>
                                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Nombre Completo</label>
                                <input type="text" value="María Escobedo" style="width:100%; padding:12px 15px; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; color:var(--text-dark); background:#f8fafc; outline:none;">
                            </div>
                            <div>
                                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Correo Electrónico</label>
                                <input type="email" value="maria.escobedo@colegio.edu.co" style="width:100%; padding:12px 15px; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; color:var(--text-dark); background:#f8fafc; outline:none;">
                            </div>
                            <div>
                                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:8px;">Curso</label>
                                <input type="text" value="7°B" disabled style="width:100%; padding:12px 15px; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; color:var(--text-gray); background:#f1f5f9; outline:none;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONFIGURACION -->
            <div id="view-configuraciones" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                        <h1>CONFIGURACIONES</h1>
                        <h2>Ajustes de notificaciones y seguridad</h2>
                    </div>
                    <button class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</button>
                </header>
                <div class="tables-container" style="grid-template-columns: 1fr; margin-top:20px; align-items: start;">
                    <div class="table-card">
                        <h3 class="card-title">Preferencias de Notificación</h3>
                        <div style="display:flex; flex-direction:column; gap:28px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div><div style="font-weight:600; color:#1e293b; margin-bottom:6px;">Alertas de Asistencia</div><div style="font-size:13px; color:var(--text-gray); line-height:1.4;">Recibir alertas sobre mis inasistencias o llegadas tarde.</div></div>
                                <label style="position:relative; display:inline-block; width:50px; height:26px; flex-shrink:0;"><input type="checkbox" checked style="opacity:0; width:0; height:0;"><span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--blue-primary); border-radius:34px; transition:.4s;"><span style="position:absolute; content:''; height:20px; width:20px; left:27px; bottom:3px; background-color:white; border-radius:50%; transition:.4s; box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span></span></label>
                            </div>

                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div><div style="font-weight:600; color:#1e293b; margin-bottom:6px;">Reportes Semanales</div><div style="font-size:13px; color:var(--text-gray); line-height:1.4;">Enviar resumen semanal a mi correo electrónico.</div></div>
                                <label style="position:relative; display:inline-block; width:50px; height:26px; flex-shrink:0;"><input type="checkbox" checked style="opacity:0; width:0; height:0;"><span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--blue-primary); border-radius:34px; transition:.4s;"><span style="position:absolute; content:''; height:20px; width:20px; left:27px; bottom:3px; background-color:white; border-radius:50%; transition:.4s; box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span></span></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PLACEHOLDER VIEWS FOR SIDEBAR -->
            <div id="view-asistencia" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                         <h1>MI ASISTENCIA HISTÓRICA</h1>
                         <h2>Detalle de mis asistencias e inasistencias</h2>
                    </div>
                </header>
                <div style="padding: 40px; text-align: center; color: var(--text-gray);"><i class="fa-regular fa-calendar-check" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i><p>Tu historial de asistencia detallado aparecerá aquí.</p></div>
            </div>

            <div id="view-reportes" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                         <h1>MIS REPORTES</h1>
                         <h2>Reportes generados por el coordinador y sistema</h2>
                    </div>
                </header>
                <div style="padding: 40px; text-align: center; color: var(--text-gray);"><i class="fa-regular fa-calendar" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i><p>Tus reportes aparecerán aquí.</p></div>
            </div>

            <div id="view-horario" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                         <h1>MI HORARIO</h1>
                         <h2>Horario de clases del curso 7°B</h2>
                    </div>
                </header>
                <div style="padding: 40px; text-align: center; color: var(--text-gray);"><i class="fa-regular fa-clock" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i><p>La vista interactiva de tu horario aparecerá aquí.</p></div>
            </div>

            <div id="view-reportes-detallados" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                         <h1>REPORTES DETALLADOS</h1>
                         <h2>Gráficos de rendimiento académico y disciplinario</h2>
                    </div>
                </header>
                <div style="padding: 40px; text-align: center; color: var(--text-gray);"><i class="fa-solid fa-chart-line" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i><p>Los gráficos analíticos avanzados aparecerán aquí.</p></div>
            </div>

            <div id="view-profesores" class="view-section" style="display: none;">
                <header class="top-header">
                    <div class="header-titles">
                         <h1>MIS PROFESORES</h1>
                         <h2>Directorio y contacto de mis docentes</h2>
                    </div>
                </header>
                <div style="padding: 40px; text-align: center; color: var(--text-gray);"><i class="fa-solid fa-chalkboard-user" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i><p>El listado de tus profesores aparecerá aquí.</p></div>
            </div>

            <footer class="dashboard-footer">`);

// 4. Update JS logic
const oldJS = `        // Sidebar Active State
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                this.classList.add('active');
            });
        });`;

const newJS = `        // Navigation logic (SPA style derived from coordinadores)
        const navLinks = document.querySelectorAll('.nav-link[data-target]');
        const viewSections = document.querySelectorAll('.view-section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // If it's a sidebar link, update active states
                if (link.closest('.sidebar-nav')) {
                    document.querySelectorAll('.sidebar-nav li').forEach(l => l.classList.remove('active'));
                    link.parentElement.classList.add('active');
                }
                
                // Hide Profile Dropdown if open
                if (profileDropdown) {
                    profileDropdown.style.opacity = '0';
                    profileDropdown.style.visibility = 'hidden';
                    profileDropdown.style.transform = 'translateY(-10px)';
                }
                
                // Hide all sections
                viewSections.forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                });
                
                // Show corresponding section
                const targetId = link.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                    setTimeout(() => targetSection.classList.add('active'), 10);
                }
                
                // On mobile, close sidebar after clicking
                if (window.innerWidth <= 768 && document.getElementById('mainSidebar') && !document.getElementById('mainSidebar').classList.contains('collapsed')) {
                     document.getElementById('mainSidebar').classList.add('collapsed');
                }
            });
        });`;

content = content.replace(oldJS, newJS);

fs.writeFileSync(filePath, content);
console.log('Successfully updated index.html for students!');
