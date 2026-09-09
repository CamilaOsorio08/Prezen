document.addEventListener('DOMContentLoaded', () => {
    // 0. Sincronizar datos del usuario desde LocalStorage en todas las páginas asociadas a dashboard.js
    try {
        const storedData = localStorage.getItem('profileData');
        if (storedData) {
            const profileData = JSON.parse(storedData);
            
            const navbarAvatar = document.querySelector('.user-profile .avatar');
            if (navbarAvatar && profileData.fotoBase64 && profileData.fotoBase64.startsWith('data:image')) {
                navbarAvatar.src = profileData.fotoBase64;
            }

            // También actualizar la foto grande del perfil (en profile.html)
            const profilePreview = document.getElementById('profileImagePreview');
            if (profilePreview && profileData.fotoBase64 && profileData.fotoBase64.startsWith('data:image')) {
                profilePreview.src = profileData.fotoBase64;
            }

            // Actualizar los inputs de la vista de perfil
            const profileInputs = document.querySelectorAll('.profile-input');
            if (profileInputs.length >= 5) {
                if (profileData.nombre) profileInputs[0].value = profileData.nombre;
                if (profileData.rol) profileInputs[1].value = profileData.rol;
                if (profileData.identificacion) profileInputs[2].value = profileData.identificacion;
                if (profileData.correo) profileInputs[3].value = profileData.correo;
                if (profileData.telefono) profileInputs[4].value = profileData.telefono;
            }

            const userNameDisplay = document.querySelector('.user-profile .user-name');
            if (userNameDisplay && profileData.nombre) {
                userNameDisplay.textContent = profileData.nombre;
            }

            const userRoleDisplay = document.querySelector('.user-profile .user-role');
            if (userRoleDisplay && profileData.rol) {
                userRoleDisplay.textContent = profileData.rol;
            }
        }
    } catch (e) {
        console.error("Error recuperando profileData:", e);
    }

    // 1. Time Updater (Actualizado hace X seg)
    const updateBadge = document.querySelector('.badge-update');
    if (updateBadge) {
        let seconds = 12; // Start from 12 like the design
        setInterval(() => {
            seconds++;
            updateBadge.innerHTML = `<i class="fa-solid fa-droplet" style="color: #22c55e;"></i> Actualizado hace ${seconds} seg`;
        }, 1000);
    }

    // Elements for filtering
    const searchInput = document.querySelector('.search-box input');
    const statusFilter = document.getElementById('statusFilter');
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    const totalBox = document.querySelector('.total-box strong');

    // 2. Filter Function (Search + Dropdown)
    function filterTable() {
        if (!tableRows.length) return;

        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const filterStatus = statusFilter ? statusFilter.value : 'All';

        let visibleCount = 0;

        tableRows.forEach(row => {
            const nameNode = row.querySelector('.custom-checkbox');
            const statusNode = row.querySelector('.status');

            if (nameNode && statusNode) {
                const name = nameNode.textContent.toLowerCase();
                const status = statusNode.textContent.trim();

                const matchesSearch = name.includes(term);
                const matchesStatus = (filterStatus === 'All') || (status === filterStatus);

                if (matchesSearch && matchesStatus) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            }
        });

        // Update total counter
        if (totalBox) {
            totalBox.textContent = visibleCount;
        }
    }

    // Attach events to search and select
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }

    // 3. Select All Functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            const isChecked = this.checked;
            tableRows.forEach(row => {
                // only toggle visible rows
                if (row.style.display !== 'none') {
                    const rowCheckbox = row.querySelector('.custom-checkbox input[type="checkbox"]');
                    if (rowCheckbox) {
                        rowCheckbox.checked = isChecked;
                    }
                }
            });
        });
    }

    // 4. Interactive Action Buttons
    const btnExport = document.querySelector('.fa-upload')?.parentElement;
    if (btnExport) btnExport.addEventListener('click', () => alert('Preparando archivo para exportar...'));

    const btnImport = document.querySelector('.fa-download')?.parentElement;
    if (btnImport) btnImport.addEventListener('click', () => alert('Abre selector de archivos CSV/Excel para importar...'));

    const btnAddReport = document.querySelector('.btn-report');
    // if (btnAddReport) btnAddReport.addEventListener('click', () => alert('Abriendo formulario para crear nuevo reporte de asistencia...'));

    const btnInvite = document.querySelector('.invite-btn');
    if (btnInvite) btnInvite.addEventListener('click', () => alert('Enviar correo de invitación a nuevo miembro del staff.'));

    // Estudiantes en riesgo botones interactivos
    const btnRiesgo = document.querySelectorAll('.riesgo-item button');
    btnRiesgo.forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.classList.contains('outline')) {
                // Iniciar proceso -> Proceso activo
                this.classList.remove('outline');
                this.textContent = 'Proceso Activo';
                this.style.background = '#4f46e5';
                this.style.color = 'white';
            } else if (this.textContent.includes('Notificar padres')) {
                // Notificar -> Notificado!
                this.textContent = 'Notificado ✓';
                this.style.background = '#22c55e'; // Verde
                this.style.borderColor = '#22c55e';
            }
        });
    });

    // 5. Pagination aesthetics
    const paginationBullets = document.querySelectorAll('.pagination span:not(:first-child):not(:last-child)');
    paginationBullets.forEach(bullet => {
        bullet.addEventListener('click', function () {
            if (this.textContent !== '...') {
                paginationBullets.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Efecto visual simulado de refresco en la tabla
                tableRows.forEach(row => row.style.opacity = '0.5');
                setTimeout(() => {
                    tableRows.forEach(row => row.style.opacity = '1');
                }, 300);
            }
        });
    });

    // Initial run to set the counter
    filterTable();
    // 6. User Profile Dropdown Toggle
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileChevron = document.querySelector('.profile-chevron');

    if (userProfileBtn && profileDropdown) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se cierre al hacer click en el propio botón
            profileDropdown.classList.toggle('show');
            if (profileDropdown.classList.contains('show')) {
                if (profileChevron) profileChevron.style.transform = 'rotate(180deg)';
            } else {
                if (profileChevron) profileChevron.style.transform = 'rotate(0deg)';
            }
            
            // Cerrar notificaciones si están abiertas
            const notificationsDropdown = document.getElementById('notificationsDropdown');
            if (notificationsDropdown && notificationsDropdown.style.display === 'block') {
                notificationsDropdown.style.display = 'none';
            }
        });

        // Cerrar el dropdown al hacer click en HTML / afuera
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
                if (profileChevron) profileChevron.style.transform = 'rotate(0deg)';
            }
        });
    }

    // 7. Notifications Dropdown Toggle
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const notificationCountBadge = document.getElementById('notificationCountBadge');
    
    if (notificationBtn && notificationsDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = notificationsDropdown.style.display === 'block';
            
            // Toggle
            notificationsDropdown.style.display = isVisible ? 'none' : 'block';
            
            // Cerrar el perfil si está abierto
            if (profileDropdown && profileDropdown.classList.contains('show')) {
                profileDropdown.classList.remove('show');
                if (profileChevron) profileChevron.style.transform = 'rotate(0deg)';
            }
            
            // Limpiar contador visual al abrir
            if (!isVisible && notificationCountBadge) {
                notificationCountBadge.style.display = 'none';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!notificationBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.style.display = 'none';
            }
        });

        // Simular llegada de nueva notificación a los 6 segundos
        setTimeout(() => {
            const listContainer = notificationsDropdown.querySelectorAll('div')[1]; // El div con max-height
            
            if (listContainer) {
                const newItem = document.createElement('div');
                newItem.onclick = () => window.location.href = 'reporte_detalle.html?id=3';
                newItem.style.padding = '15px';
                newItem.style.borderBottom = '1px solid #e2e8f0';
                newItem.style.display = 'flex';
                newItem.style.gap = '12px';
                newItem.style.cursor = 'pointer';
                newItem.style.transition = 'background 0.2s';
                newItem.onmouseover = () => newItem.style.background = '#f8fafc';
                newItem.onmouseout = () => newItem.style.background = 'transparent';
                newItem.innerHTML = `
                    <div style="width: 36px; height: 36px; background: #eff6ff; color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fa-solid fa-notes-medical"></i>
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.4;"><strong>Justificación Recibida</strong> (Pedro Gómez)</p>
                        <span style="font-size: 11px; color: #3b82f6; font-weight: 600;">Justo ahora</span>
                    </div>
                `;
                
                // Insertar al inicio de la lista
                listContainer.insertBefore(newItem, listContainer.firstChild);
                
                // Animar / aparecer contador de nuevo si no está abierto el menú
                if (notificationCountBadge && notificationsDropdown.style.display !== 'block') {
                    // Obtener número anterior del HTML estático o empezar en 3
                    let currentCount = parseInt(notificationCountBadge.textContent || "3");
                    currentCount++;
                    notificationCountBadge.textContent = currentCount;
                    notificationCountBadge.style.display = 'block';
                    notificationCountBadge.style.transform = 'scale(1.5)';
                    setTimeout(() => notificationCountBadge.style.transform = 'scale(1)', 300);
                }
            }
        }, 6000);
    }

// 8. Add Report Modal Logic
    const btnNewReportItems = [document.getElementById('authBtnReport')].filter(Boolean);
    const addReportModal = document.getElementById('addReportModal');
    const closeAddReportBtn = document.getElementById('closeAddReportBtn');
    const cancelAddReportBtn = document.getElementById('cancelAddReportBtn');
    const createReportBtn = document.getElementById('createReportBtn');
    
    // Success Modal elements
    const reportSuccessModal = document.getElementById('reportSuccessModal');
    const closeReportSuccessBtn = document.getElementById('closeReportSuccessBtn');
    
    if(addReportModal) {
        const reportModalContent = addReportModal.querySelector('div');

        const toggleReportModal = (show) => {
            if(show) {
                addReportModal.style.display = 'flex';
                setTimeout(() => reportModalContent.style.transform = 'scale(1)', 10);
            } else {
                reportModalContent.style.transform = 'scale(0.95)';
                setTimeout(() => addReportModal.style.display = 'none', 200);
            }
        };

        btnNewReportItems.forEach(btn => {
            btn.addEventListener('click', () => toggleReportModal(true));
        });

        if(closeAddReportBtn) closeAddReportBtn.addEventListener('click', () => toggleReportModal(false));
        if(cancelAddReportBtn) cancelAddReportBtn.addEventListener('click', () => toggleReportModal(false));

        if(createReportBtn) {
            createReportBtn.addEventListener('click', () => {
                const originalHtml = createReportBtn.innerHTML;
                createReportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
                createReportBtn.style.opacity = '0.7';
                createReportBtn.disabled = true;

                setTimeout(() => {
                    // Simular descarga
                    const fakeLink = document.createElement('a');
                    const blob = new Blob(["Simulación de reporte PDF generado por PREZEN"], { type: 'application/pdf' });
                    fakeLink.href = URL.createObjectURL(blob);
                    fakeLink.download = "Reporte_Prezen.pdf";
                    fakeLink.click();

                    // Cerrar el modal principal de crear reporte
                    toggleReportModal(false);
                    
                    // Resetear el botón original
                    setTimeout(() => {
                        createReportBtn.innerHTML = originalHtml;
                        createReportBtn.style.background = '#3b82f6';
                        createReportBtn.style.opacity = '1';
                        createReportBtn.disabled = false;
                        
                        // Mostrar el modal de éxito
                        if (reportSuccessModal) {
                            const successContent = reportSuccessModal.querySelector('div');
                            reportSuccessModal.style.display = 'flex';
                            setTimeout(() => successContent.style.transform = 'scale(1)', 10);
                        }
                    }, 200);

                }, 1500);
            });
        }
        
        // Cierre del modal de éxito
        if (closeReportSuccessBtn && reportSuccessModal) {
            closeReportSuccessBtn.addEventListener('click', () => {
                const successContent = reportSuccessModal.querySelector('div');
                successContent.style.transform = 'scale(0.95)';
                setTimeout(() => reportSuccessModal.style.display = 'none', 200);
            });
        }
    }

    // 9. Sidebar Navigation Logic
    const sidebarItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const homeDashboardView = document.getElementById('homeDashboardView');
    const attendanceView = document.getElementById('attendanceView');
    const genericView = document.getElementById('genericView');
    const genericViewModule = document.getElementById('genericViewModule');

    if (sidebarItems.length > 0 && homeDashboardView && genericView) {
        sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // prevent anchor # jump
                
                // Remover active de todos los items
                sidebarItems.forEach(nav => nav.classList.remove('active'));
                
                // Agregar active al clickeado
                item.classList.add('active');

                // Obtener el texto del elemento (limpiando íconos u otros tags HTML)
                const moduleName = item.textContent.trim();

                // Resetear todas las vistas primero
                homeDashboardView.style.display = 'none';
                if (attendanceView) attendanceView.style.display = 'none';
                genericView.style.display = 'none';

                if (moduleName.toLowerCase() === 'inicio') {
                    homeDashboardView.style.display = 'block';
                } else if (moduleName.toLowerCase() === 'asistencia') {
                    if (attendanceView) {
                        attendanceView.style.display = 'block';
                    } else {
                        // Fallback si por alguna razón no existe el div
                        genericView.style.display = 'flex';
                        if (genericViewModule) genericViewModule.textContent = moduleName;
                    }
                } else {
                    genericView.style.display = 'flex';
                    if (genericViewModule) {
                        genericViewModule.textContent = moduleName;
                    }
                }
            });
        });
    }

});
