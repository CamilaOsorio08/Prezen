document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Navigation logic (SPA style)
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Add active class to clicked item
            link.parentElement.classList.add('active');
            
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
        });
    });

    // Profile Dropdown logic
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (userProfileBtn && profileDropdown) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
            userProfileBtn.classList.toggle('active');
            
            // Cerrar notificaciones si está abierto
            const notificationsDropdown = document.getElementById('notificationsDropdown');
            if (notificationsDropdown && notificationsDropdown.style.display === 'block') {
                notificationsDropdown.style.display = 'none';
            }
        });

        // Cerrar el dropdown al hacer click en HTML / afuera
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
                userProfileBtn.classList.remove('active');
            }
            const notificationsDropdown = document.getElementById('notificationsDropdown');
            const notificationBtn = document.getElementById('notificationBtn');
            if (notificationBtn && notificationsDropdown && !notificationBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.style.display = 'none';
            }
        });

        // --- Add Report Modal Logic ---
        const btnNewReportItems = document.querySelectorAll('.btn-new-report, .btn-report');
        const addReportModal = document.getElementById('addReportModal');
        const closeAddReportBtn = document.getElementById('closeAddReportBtn');
        const cancelAddReportBtn = document.getElementById('cancelAddReportBtn');
        const createReportBtn = document.getElementById('createReportBtn');
        
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
                        createReportBtn.style.background = '#22c55e';
                        createReportBtn.innerHTML = '<i class="fa-solid fa-check"></i> Descargando PDF...';

                        // Simular descarga de PDF
                        const fakeLink = document.createElement('a');
                        const blob = new Blob(["Simulación de reporte PDF generado por PREZEN"], { type: 'application/pdf' });
                        fakeLink.href = URL.createObjectURL(blob);
                        fakeLink.download = "Reporte_Prezen.pdf";
                        fakeLink.click();

                        setTimeout(() => {
                            toggleReportModal(false);
                            setTimeout(() => {
                                createReportBtn.innerHTML = originalHtml;
                                createReportBtn.style.background = '#3b82f6';
                                createReportBtn.style.opacity = '1';
                                createReportBtn.disabled = false;
                            }, 300);
                        }, 1500);
                    }, 1500);
                });
            }
        }
    }

    // Notification Dropdown logic
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const notificationCountBadge = document.getElementById('notificationCountBadge');
    const notificationsList = document.getElementById('notificationsList');

    if (notificationBtn && notificationsDropdown) {
        // Render mock notifications
        const mockNotifications = [
            { id: 1, title: 'Inasistencia Crítica', desc: 'María Escobedo (7°B) faltó por 3ra vez consecutiva', time: 'Hace 5 min', type: 'danger', icon: 'fa-triangle-exclamation' },
            { id: 2, title: 'Nuevo Soporte Médico', desc: 'Madre de Juan Pérez adjuntó un certificado médico.', time: 'Hace 30 min', type: 'info', icon: 'fa-file-medical' },
            { id: 3, title: 'Tardanza Registrada', desc: 'Ana López (7°B) llegó tarde al plantel.', time: 'Hace 1 hora', type: 'warning', icon: 'fa-clock' },
            { id: 4, title: 'Reporte Generado', desc: 'El reporte semanal de asistencia está listo.', time: 'Ayer', type: 'success', icon: 'fa-file-excel' },
            { id: 5, title: 'Reunión de Profesores', desc: 'Junta de coordinación a las 3:00 PM.', time: 'Ayer', type: 'info', icon: 'fa-users' }
        ];

        function renderNotifications() {
            if (!notificationsList) return;
            notificationsList.innerHTML = '';
            
            const typeColors = {
                'danger': '#ef4444',
                'info': '#3b82f6',
                'warning': '#f59e0b',
                'success': '#22c55e'
            };

            const typeBgs = {
                'danger': '#fef2f2',
                'info': '#eff6ff',
                'warning': '#fffbeb',
                'success': '#f0fdf4'
            };

            mockNotifications.forEach(notif => {
                const item = document.createElement('div');
                item.style.padding = '15px 20px';
                item.style.borderBottom = '1px solid var(--border-color)';
                item.style.display = 'flex';
                item.style.gap = '15px';
                item.style.cursor = 'pointer';
                item.style.transition = 'background 0.2s';
                
                item.onmouseover = () => item.style.background = '#f8fafc';
                item.onmouseout = () => item.style.background = 'transparent';
                item.onclick = () => {
                    // Navigate from panel_control/coordinadores/ to auth/
                    window.location.href = '../../auth/reporte_detalle.html?id=' + notif.id;
                };

                item.innerHTML = `
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${typeBgs[notif.type]}; color: ${typeColors[notif.type]}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px;">
                        <i class="fa-solid ${notif.icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong style="font-size: 13px; color: var(--text-dark);">${notif.title}</strong>
                            <span style="font-size: 11px; color: var(--text-gray);">${notif.time}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-gray); line-height: 1.4;">
                            ${notif.desc}
                        </div>
                    </div>
                `;
                notificationsList.appendChild(item);
            });
            
            // Solo actualizamos el bagde si no está el dropdown activado como abierto
            if (notificationCountBadge && notificationsDropdown.style.display !== 'block') {
                notificationCountBadge.textContent = mockNotifications.length;
                notificationCountBadge.style.display = mockNotifications.length > 0 ? 'block' : 'none';
            }
        }

        renderNotifications();

        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = notificationsDropdown.style.display === 'block';
            
            // Cerrar el de perfil si está abierto
            if (profileDropdown && profileDropdown.classList.contains('active')) {
                profileDropdown.classList.remove('active');
                if (userProfileBtn) userProfileBtn.classList.remove('active');
            }
            
            notificationsDropdown.style.display = isVisible ? 'none' : 'block';
            
            // Al activarse, esconder el numerito simulando que ya se están leyendo
            if (!isVisible && notificationCountBadge) {
                notificationCountBadge.style.display = 'none';
            }
        });

        // Simular la llegada de una notificación a los 6 segundos
        setTimeout(() => {
            const nuevaNotif = { 
                id: 6, 
                title: 'Nuevo Justificante Médico', 
                desc: 'Acudiente de Pedro Gómez cargó una incapacidad por 2 días.', 
                time: 'Justo ahora', 
                type: 'info', 
                icon: 'fa-notes-medical' 
            };
            
            // Agregar al inicio
            mockNotifications.unshift(nuevaNotif);
            
            // Volver a renderizar
            renderNotifications();
            
            // Animar un poco el badge
            if (notificationCountBadge && notificationsDropdown.style.display !== 'block') {
                notificationCountBadge.style.transform = 'scale(1.5)';
                setTimeout(() => notificationCountBadge.style.transform = 'scale(1)', 300);
            }
        }, 6000);

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mockNotifications.length = 0;
                renderNotifications();
                notificationsList.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-gray); font-size: 13px;"><i class="fa-solid fa-check-double" style="font-size: 24px; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>No tienes notificaciones nuevas</div>';
                if(notificationCountBadge) notificationCountBadge.style.display = 'none';
            });
        }

        document.addEventListener('click', (e) => {
            if (!notificationBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.style.display = 'none';
            }
        });
    }

    // QR Scanner Implementation
    const qrModal = document.getElementById('qrModal');
    const closeQrModal = document.getElementById('closeQrModal');
    const stopScannerBtn = document.getElementById('stopScanner');
    const btnScanQR = document.getElementById('btnScanQR');
    
    let html5QrCode;

    function stopScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log("Scanner stopped.");
                qrModal.classList.remove('active');
                setTimeout(() => { qrModal.style.display = 'none'; }, 300);
            }).catch(err => console.error("Error stopping scanner:", err));
        } else {
            qrModal.classList.remove('active');
            setTimeout(() => { qrModal.style.display = 'none'; }, 300);
        }
    }

    if (btnScanQR) {
        btnScanQR.addEventListener('click', () => {
            qrModal.style.display = 'flex';
            setTimeout(() => { qrModal.classList.add('active'); }, 10);
            
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("qr-reader");
            }

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            html5QrCode.start(
                { facingMode: "environment" }, 
                config,
                (decodedText, decodedResult) => {
                    // Success callback
                    console.log(`Code matched = ${decodedText}`, decodedResult);
                    
                    // Simple success alert
                    alert(`¡ASISTENCIA REGISTRADA!\nEstudiante ID: ${decodedText}\nHora: ${new Date().toLocaleTimeString()}`);
                    
                    // NEW: Update Scan Result Card
                    document.getElementById('displayScanName').innerText = "María Escobedo (ID: " + decodedText + ")";
                    document.getElementById('displayScanDate').innerText = new Date().toLocaleDateString();
                    document.getElementById('displayScanTime').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    document.getElementById('displayScanStatus').innerText = "PUNTUAL";
                    document.getElementById('displayScanStatus').className = "scan-badge text-success";
                    
                    // Switch to Tomar Asistencia view
                    const navTomarAsistencia = document.querySelector('.nav-link[data-target="view-tomar-asistencia"]');
                    if (navTomarAsistencia) navTomarAsistencia.click();

                    stopScanner();
                },
                (errorMessage) => {
                    // parse error, ignore it as it's very common during scan
                }
            ).catch(err => {
                console.error("Unable to start scanning:", err);
                alert("Error: No se pudo acceder a la cámara. Asegúrese de otorgar los permisos necesarios.");
                stopScanner();
            });
        });
    }

    if (closeQrModal) closeQrModal.addEventListener('click', stopScanner);
    if (stopScannerBtn) stopScannerBtn.addEventListener('click', stopScanner);

    // Other attendance buttons (Placeholders)
    const btnScanHuella = document.getElementById('btnScanHuella');
    const btnAsistenciaManual = document.getElementById('btnAsistenciaManual');

    if (btnScanHuella) {
        btnScanHuella.addEventListener('click', () => {
            alert('Esperando detección de huella en el lector biométrico conectado...');
        });
    }

    if (btnAsistenciaManual) {
        btnAsistenciaManual.addEventListener('click', () => {
            alert('Abriendo formulario de entrada manual de asistencia...');
        });
    }

    // Config functionality (Change photo & save changes)
    const btnChangePhoto = document.getElementById('btnChangePhoto');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const btnGuardarConfig = document.getElementById('btnGuardarConfig');
    const saveSuccessModal = document.getElementById('saveSuccessModal');
    const closeSaveSuccessModal = document.getElementById('closeSaveSuccessModal');

    // Cargar datos previos
    try {
        const storedCoords = localStorage.getItem('coordsProfileData');
        if (storedCoords) {
            const profileData = JSON.parse(storedCoords);
            if (profileData.fotoBase64) {
                if (profileImagePreview) profileImagePreview.src = profileData.fotoBase64;
                const headerProfileImg = document.querySelector('.user-profile .avatar-wrapper img');
                if (headerProfileImg) headerProfileImg.src = profileData.fotoBase64;
                // Also update the large hero photo if needed
            }
            if (profileData.nombre && document.getElementById('coordNameInput')) {
                document.getElementById('coordNameInput').value = profileData.nombre;
                const roleNode = document.querySelector('.user-profile .user-name');
                if (roleNode) roleNode.textContent = profileData.nombre + " -";
            }
            if (profileData.correo && document.getElementById('coordEmailInput')) {
                document.getElementById('coordEmailInput').value = profileData.correo;
            }
            if (profileData.pass && document.getElementById('coordPassInput')) {
                document.getElementById('coordPassInput').value = profileData.pass;
            }
        }
    } catch(e) {}

    if (btnChangePhoto && profileImageInput) {
        btnChangePhoto.addEventListener('click', () => {
            profileImageInput.click();
        });

        profileImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const newImageBase64 = event.target.result;
                    if (profileImagePreview) profileImagePreview.src = newImageBase64;
                    
                    const headerProfileImg = document.querySelector('.user-profile .avatar-wrapper img');
                    if (headerProfileImg) {
                        headerProfileImg.src = newImageBase64;
                    }
                    
                    // Auto-guardado
                    try {
                        let savedData = JSON.parse(localStorage.getItem('coordsProfileData') || '{}');
                        savedData.fotoBase64 = newImageBase64;
                        localStorage.setItem('coordsProfileData', JSON.stringify(savedData));
                    } catch (err) {}
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnGuardarConfig && saveSuccessModal) {
        btnGuardarConfig.addEventListener('click', () => {
            const profileDataJSON = {
                nombre: document.getElementById('coordNameInput') ? document.getElementById('coordNameInput').value : '',
                correo: document.getElementById('coordEmailInput') ? document.getElementById('coordEmailInput').value : '',
                pass: document.getElementById('coordPassInput') ? document.getElementById('coordPassInput').value : '',
                fotoBase64: profileImagePreview && profileImagePreview.src.startsWith('data:image') ? profileImagePreview.src : ''
            };
            
            try {
                localStorage.setItem('coordsProfileData', JSON.stringify(profileDataJSON));
                
                const blob = new Blob([JSON.stringify(profileDataJSON, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'coordinador_perfil.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Actualizar header Name instantes despues de guardar
                const roleNode = document.querySelector('.user-profile .user-name');
                if (roleNode && profileDataJSON.nombre) roleNode.textContent = profileDataJSON.nombre + " -";

            } catch(e) {
                console.error('Error al guardar JSON de coordinador', e);
            }
            
            saveSuccessModal.style.display = 'flex';
            setTimeout(() => { saveSuccessModal.classList.add('active'); }, 10);
        });
    }

    if (closeSaveSuccessModal) {
        closeSaveSuccessModal.addEventListener('click', () => {
            saveSuccessModal.classList.remove('active');
            setTimeout(() => { saveSuccessModal.style.display = 'none'; }, 300);
        });
    }
});
