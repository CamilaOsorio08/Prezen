document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    const themeToggle = document.getElementById('themeToggle');
    const applyTheme = (dark) => {
        document.body.classList.toggle('dark-mode', dark);
        if (themeToggle) {
            themeToggle.innerHTML = dark ? '<i class="fa-solid fa-sun"></i> <span>Modo claro</span>' : '<i class="fa-solid fa-moon"></i> <span>Modo oscuro</span>';
            themeToggle.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        }
    };
    applyTheme(localStorage.getItem('prezen-theme') === 'dark');
    themeToggle?.addEventListener('click', () => {
        const dark = !document.body.classList.contains('dark-mode');
        localStorage.setItem('prezen-theme', dark ? 'dark' : 'light');
        applyTheme(dark);
    });

    // Navigation logic (SPA style)
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const viewSections = document.querySelectorAll('.view-section');
    const sharedHeaderActions = document.querySelector('#view-estudiantes .header-actions');
    const composeHeaderButton = document.getElementById('composeCommunicationBtn');
    const composeHeaderParent = composeHeaderButton?.parentElement;
    const composeHeaderNextSibling = composeHeaderButton?.nextElementSibling;

    const placeSharedHeaderActions = (targetSection) => {
        const targetHeader = targetSection?.querySelector('.top-header');
        if (!sharedHeaderActions || !targetHeader) return;

        targetHeader.appendChild(sharedHeaderActions);
        if (composeHeaderButton && composeHeaderParent) {
            if (targetSection.id === 'view-comunicaciones') {
                sharedHeaderActions.appendChild(composeHeaderButton);
            } else if (composeHeaderButton.parentElement !== composeHeaderParent) {
                composeHeaderParent.insertBefore(composeHeaderButton, composeHeaderNextSibling);
            }
        }
    };

    document.getElementById('view-configuraciones')?.remove();
    document.querySelectorAll('[data-target="view-configuraciones"]').forEach(link => link.closest('li, .dropdown-item')?.remove());
    placeSharedHeaderActions(document.getElementById('view-panel'));

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
                placeSharedHeaderActions(targetSection);
                setTimeout(() => targetSection.classList.add('active'), 10);
            }
        });
    });

    const statCards = document.querySelectorAll('.stat-card-action[data-metric]');
    const metricDetailModal = document.getElementById('metricDetailModal');
    const metricDetailTitle = document.getElementById('metricDetailTitle');
    const metricDetailBody = document.getElementById('metricDetailBody');
    const closeMetricDetailBtn = document.getElementById('closeMetricDetailBtn');
    const closeMetricDetailFooterBtn = document.getElementById('closeMetricDetailFooterBtn');

    const metricDetails = {
        students: {
            title: 'Detalle de estudiantes',
            value: '28',
            label: 'estudiantes activos en todos los grados',
            rows: [['Presentes hoy', '25'], ['Con asistencia superior al 90%', '18'], ['Estudiantes en riesgo', '3']]
        },
        attendance: {
            title: 'Detalle de asistencia promedio',
            value: '88%',
            label: 'promedio del curso durante marzo',
            rows: [['Asistencias registradas', '246'], ['Inasistencias justificadas', '8'], ['Meta del curso', '90%']]
        },
        late: {
            title: 'Detalle de tardanzas del mes',
            value: '15',
            label: 'tardanzas registradas durante marzo',
            rows: [['Ana López', '5 tardanzas'], ['Juan Pérez', '5 tardanzas'], ['María Escobedo', '4 tardanzas'], ['Otros estudiantes', '1 tardanza']]
        },
        absences: {
            title: 'Detalle de inasistencias',
            value: '8',
            label: 'inasistencias registradas durante marzo',
            rows: [['Juan Pérez', '3 inasistencias'], ['Ana López', '3 inasistencias'], ['María Escobedo', '2 inasistencias']]
        }
    };

    const closeMetricDetail = () => {
        if (!metricDetailModal) return;
        metricDetailModal.classList.remove('active');
        metricDetailModal.setAttribute('aria-hidden', 'true');
    };

    const openMetricDetail = (metricId) => {
        const detail = metricDetails[metricId];
        if (!detail || !metricDetailModal || !metricDetailTitle || !metricDetailBody) return;
        metricDetailTitle.textContent = detail.title;
        metricDetailBody.innerHTML = `
            <div class="metric-detail-summary">
                <strong class="metric-detail-number">${detail.value}</strong>
                <span class="metric-detail-label">${detail.label}</span>
            </div>
            <ul class="metric-detail-list">
                ${detail.rows.map(([name, value]) => `<li><strong>${name}</strong><span>${value}</span></li>`).join('')}
            </ul>`;
        metricDetailModal.classList.add('active');
        metricDetailModal.setAttribute('aria-hidden', 'false');
        closeMetricDetailBtn?.focus();
    };

    statCards.forEach(card => {
        const showCardDetail = () => openMetricDetail(card.dataset.metric);

        card.addEventListener('click', showCardDetail);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                showCardDetail();
            }
        });
    });

    closeMetricDetailBtn?.addEventListener('click', closeMetricDetail);
    closeMetricDetailFooterBtn?.addEventListener('click', closeMetricDetail);
    metricDetailModal?.addEventListener('click', (event) => {
        if (event.target === metricDetailModal) closeMetricDetail();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMetricDetail();
    });

    const filterGrade = document.getElementById('filterGrade');
    const filterFirstName = document.getElementById('filterFirstName');
    const filterLastName = document.getElementById('filterLastName');
    const filterDocument = document.getElementById('filterDocument');
    const clearStudentFilters = document.getElementById('clearStudentFilters');
    let studentRows = [...document.querySelectorAll('#studentsTableBody tr')];
    const riskRows = document.querySelectorAll('.risk-student-row');

    const applyStudentFilters = () => {
        const grade = filterGrade?.value.toLowerCase() || '';
        const firstName = filterFirstName?.value.trim().toLowerCase() || '';
        const lastName = filterLastName?.value.trim().toLowerCase() || '';
        const documentNumber = filterDocument?.value.trim().toLowerCase() || '';
        studentRows.forEach(row => {
            const matches = (!grade || row.dataset.grade.toLowerCase() === grade)
                && (!firstName || row.dataset.firstName.toLowerCase().includes(firstName))
                && (!lastName || row.dataset.lastName.toLowerCase().includes(lastName))
                && (!documentNumber || row.dataset.document.includes(documentNumber));
            row.hidden = !matches;
        });
    };

    [filterGrade, filterFirstName, filterLastName, filterDocument].forEach(field => {
        field?.addEventListener('input', applyStudentFilters);
        field?.addEventListener('change', applyStudentFilters);
    });
    clearStudentFilters?.addEventListener('click', () => {
        [filterGrade, filterFirstName, filterLastName, filterDocument].forEach(field => { if (field) field.value = ''; });
        applyStudentFilters();
    });

    const setupAutomaticStudentStatus = (row) => {
        const cells = row.querySelectorAll('td');
        const studentName = row.dataset.firstName
            ? `${row.dataset.firstName} ${row.dataset.lastName}`
            : row.dataset.riskStudent;
        const createCounter = (cellIndex, label) => {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '99';
            input.value = cells[cellIndex].textContent.trim();
            input.className = 'student-number-input';
            input.setAttribute('aria-label', `${label} de ${studentName}`);
            input.addEventListener('click', event => event.stopPropagation());
            cells[cellIndex].replaceChildren(input);
            return input;
        };
        const lateInput = createCounter(3, 'Tardanzas');
        const absenceInput = createCounter(4, 'Inasistencias');
        const statusCell = cells[5];
        const updateStatus = () => {
            const isAtRisk = Number(lateInput.value) >= 3 || Number(absenceInput.value) >= 3;
            statusCell.innerHTML = `<span class="student-auto-status ${isAtRisk ? 'status-risk' : 'status-safe'}">${isAtRisk ? 'En Riesgo' : 'Sin Riesgo'}</span>`;
            row.dataset.riskReason = isAtRisk ? 'En Riesgo' : 'Sin Riesgo';
        };
        lateInput.addEventListener('input', updateStatus);
        absenceInput.addEventListener('input', updateStatus);
        updateStatus();
    };

    riskRows.forEach(setupAutomaticStudentStatus);

    const addStudentBtn = document.getElementById('addStudentBtn');
    const addStudentModal = document.getElementById('addStudentModal');
    const addStudentForm = document.getElementById('addStudentForm');
    const closeAddStudentBtn = document.getElementById('closeAddStudentBtn');
    const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');
    const newStudentFirstName = document.getElementById('newStudentFirstName');
    const newStudentLastName = document.getElementById('newStudentLastName');
    const newStudentGrade = document.getElementById('newStudentGrade');
    const newStudentDocument = document.getElementById('newStudentDocument');

    const closeAddStudentModal = () => {
        if (addStudentModal) addStudentModal.hidden = true;
    };

    addStudentBtn?.addEventListener('click', () => {
        if (addStudentModal) addStudentModal.hidden = false;
        newStudentFirstName?.focus();
    });
    closeAddStudentBtn?.addEventListener('click', closeAddStudentModal);
    cancelAddStudentBtn?.addEventListener('click', closeAddStudentModal);

    addStudentForm?.addEventListener('submit', event => {
        event.preventDefault();
        const firstName = newStudentFirstName.value.trim();
        const lastName = newStudentLastName.value.trim();
        const grade = newStudentGrade.value;
        const documentNumber = newStudentDocument.value.trim();
        if (!firstName || !lastName || !grade || !documentNumber) return;

        const row = document.createElement('tr');
        row.className = 'student-row';
        row.dataset.grade = grade;
        row.dataset.firstName = firstName;
        row.dataset.lastName = lastName;
        row.dataset.document = documentNumber;
        row.innerHTML = `<td>${firstName} ${lastName}</td><td>${grade}</td><td>100%</td><td>0</td><td>0</td>`;
        document.getElementById('studentsTableBody')?.appendChild(row);
        studentRows = [...document.querySelectorAll('#studentsTableBody tr')];
        row.addEventListener('click', () => openStudentDetail(row));
        addStudentForm.reset();
        closeAddStudentModal();
        applyStudentFilters();
    });

    const openStudentDetail = (row) => {
        if (!metricDetailModal || !metricDetailTitle || !metricDetailBody) return;
        const cells = row.querySelectorAll('td');
        const studentName = `${row.dataset.firstName} ${row.dataset.lastName}`;
        metricDetailTitle.textContent = `Información de ${studentName}`;
        metricDetailBody.innerHTML = `<div class="metric-detail-summary"><strong class="metric-detail-number"><i class="fa-solid fa-user"></i></strong><span class="metric-detail-label">Ficha del estudiante seleccionado</span></div><ul class="metric-detail-list"><li><strong>Nombre completo</strong><span>${studentName}</span></li><li><strong>Documento de identidad</strong><span>${row.dataset.document}</span></li><li><strong>Grado</strong><span>${row.dataset.grade}</span></li><li><strong>Asistencia</strong><span>${cells[2]?.textContent.trim() || '-'}</span></li><li><strong>Tardanzas</strong><span>${cells[3]?.textContent.trim() || '-'}</span></li><li><strong>Inasistencias</strong><span>${cells[4]?.textContent.trim() || '-'}</span></li></ul>`;
        metricDetailModal.classList.add('active');
        metricDetailModal.setAttribute('aria-hidden', 'false');
        closeMetricDetailBtn?.focus();
    };

    document.querySelectorAll('.student-row').forEach(row => {
        row.addEventListener('click', () => openStudentDetail(row));
    });

    const openRiskStudentDetail = (student, reason, documentNumber) => {
        if (!metricDetailModal || !metricDetailTitle || !metricDetailBody) return;
        metricDetailTitle.textContent = `Detalle de ${student}`;
        const riskRow = [...document.querySelectorAll('.risk-student-row')].find(row => row.dataset.riskStudent === student && row.dataset.riskDocument === documentNumber);
        const grade = riskRow?.dataset.riskGrade || '-';
        metricDetailBody.innerHTML = `<div class="metric-detail-summary"><strong class="metric-detail-number">Riesgo</strong><span class="metric-detail-label">${reason}</span></div><ul class="metric-detail-list"><li><strong>Estudiante</strong><span>${student}</span></li><li><strong>Documento</strong><span>${documentNumber}</span></li><li><strong>Grado</strong><span>${grade}</span></li><li><strong>Plan de acción</strong><span>Requiere seguimiento</span></li></ul>`;
        metricDetailModal.classList.add('active');
        metricDetailModal.setAttribute('aria-hidden', 'false');
        closeMetricDetailBtn?.focus();
    };

    document.querySelectorAll('.risk-student-row').forEach(row => {
        row.addEventListener('click', () => openRiskStudentDetail(row.dataset.riskStudent, row.dataset.riskReason, row.dataset.riskDocument));
    });

    document.getElementById('viewRiskStudentsBtn')?.addEventListener('click', () => {
        const riskRows = [...document.querySelectorAll('.risk-student-row')].filter(row => row.dataset.riskReason !== 'Sin Riesgo');
        metricDetailTitle.textContent = 'Estudiantes en riesgo';
        metricDetailBody.innerHTML = `<div class="metric-detail-summary"><strong class="metric-detail-number">${riskRows.length}</strong><span class="metric-detail-label">estudiantes requieren seguimiento</span></div><ul class="metric-detail-list">${riskRows.map(row => `<li><strong>${row.dataset.riskStudent}</strong><span>${row.dataset.riskReason}</span></li>`).join('')}</ul>`;
        metricDetailModal.classList.add('active');
        metricDetailModal.setAttribute('aria-hidden', 'false');
    });

    const attendanceChart = document.querySelector('.chart-mockup');
    const attendanceBarDialog = document.getElementById('attendanceBarDialog');
    const attendanceDialogDay = document.getElementById('attendanceDialogDay');
    const attendanceDialogPercentage = document.getElementById('attendanceDialogPercentage');
    const attendanceDialogLate = document.getElementById('attendanceDialogLate');
    let attendanceDialogTimer;

    const showAttendanceBarDialog = (bar) => {
        if (!attendanceChart || !attendanceBarDialog) return;
        clearTimeout(attendanceDialogTimer);
        attendanceDialogDay.textContent = `Detalle de asistencia: ${bar.dataset.day}`;
        attendanceDialogPercentage.textContent = `Asistencia general: ${bar.dataset.attendance}`;
        attendanceDialogLate.textContent = `Llegaron tarde: ${bar.dataset.lateStudents}`;
        attendanceBarDialog.style.left = `${bar.offsetLeft + (bar.offsetWidth / 2)}px`;
        attendanceBarDialog.style.display = 'block';
        attendanceBarDialog.classList.remove('side');
        const aboveTop = bar.offsetTop - attendanceBarDialog.offsetHeight - 12;
        if (aboveTop >= 0) {
            attendanceBarDialog.style.top = `${aboveTop}px`;
        } else {
            attendanceBarDialog.classList.add('side');
            attendanceBarDialog.style.left = `${bar.offsetLeft + bar.offsetWidth + 12}px`;
            attendanceBarDialog.style.top = `${Math.max(0, bar.offsetTop - 20)}px`;
        }
        attendanceBarDialog.setAttribute('aria-hidden', 'false');
    };

    const hideAttendanceBarDialog = () => {
        attendanceDialogTimer = setTimeout(() => {
            attendanceBarDialog.style.display = 'none';
            attendanceBarDialog.setAttribute('aria-hidden', 'true');
        }, 180);
    };

    document.querySelectorAll('.chart-mockup .bar').forEach(bar => {
        bar.addEventListener('mouseenter', () => showAttendanceBarDialog(bar));
        bar.addEventListener('mouseleave', hideAttendanceBarDialog);
    });
    attendanceBarDialog?.addEventListener('mouseenter', () => clearTimeout(attendanceDialogTimer));
    attendanceBarDialog?.addEventListener('mouseleave', hideAttendanceBarDialog);
    document.getElementById('closeAttendanceBarDialog')?.addEventListener('click', () => {
        clearTimeout(attendanceDialogTimer);
        hideAttendanceBarDialog();
    });

    const reportDetailModal = document.getElementById('reportDetailModal');
    const reportDetailTitle = document.getElementById('reportDetailTitle');
    const reportDetailBadge = document.getElementById('reportDetailBadge');
    const reportDetailSummary = document.getElementById('reportDetailSummary');
    const closeReportDetailBtn = document.getElementById('closeReportDetailBtn');
    const closeReportDetailSecondaryBtn = document.getElementById('closeReportDetailSecondaryBtn');

    const getRiskLevel = (status = '') => {
        const normalized = status.toLowerCase();

        if (normalized.includes('crítico') || normalized.includes('critico') || normalized.includes('alerta')) {
            return 'alert';
        }

        if (normalized.includes('riesgo') || normalized.includes('media') || normalized.includes('alto')) {
            return 'warning';
        }

        if (normalized.includes('baja') || normalized.includes('bajo')) {
            return 'low';
        }

        return 'safe';
    };

    const applyRiskStyle = (element, status) => {
        if (!element) return;

        const riskLevel = getRiskLevel(status);
        const palette = {
            alert: { bg: '#fee2e2', color: '#b91c1c' },
            warning: { bg: '#ffedd5', color: '#b45309' },
            low: { bg: '#dbeafe', color: '#1d4ed8' },
            safe: { bg: '#dcfce7', color: '#15803d' }
        };
        const chosen = palette[riskLevel] || palette.safe;

        element.style.background = chosen.bg;
        element.style.color = chosen.color;
        element.dataset.riskLevel = riskLevel;
    };

    const openReportDetail = (grade, status, summary) => {
        if (!reportDetailModal || !reportDetailTitle || !reportDetailBadge || !reportDetailSummary) return;

        reportDetailTitle.textContent = grade;
        reportDetailBadge.textContent = status;
        applyRiskStyle(reportDetailBadge, status);
        reportDetailSummary.textContent = summary;
        reportDetailModal.style.display = 'flex';
    };

    const escapePdfText = (text = '') => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    const createPdfBlob = ({ grade, status, summary }) => {
        const header = 'PREZEN - Reporte por curso';
        const content = [
            `Curso: ${grade}`,
            `Nivel de riesgo: ${status}`,
            'Resumen:',
            summary || 'Sin observaciones adicionales.'
        ];

        const textStream = [
            'BT',
            '/F1 16 Tf',
            '50 760 Td',
            `(${escapePdfText(header)}) Tj`,
            '0 -28 Td',
            '/F1 12 Tf',
            `(${escapePdfText(content[0])}) Tj`,
            '0 -22 Td',
            `(${escapePdfText(content[1])}) Tj`,
            '0 -22 Td',
            `(${escapePdfText(content[2])}) Tj`,
            '0 -22 Td',
            `(${escapePdfText(content[3].slice(0, 180))}) Tj`,
            'ET'
        ].join('\n');

        const objects = {
            1: '<< /Type /Catalog /Pages 2 0 R >>',
            2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            4: `<< /Length ${textStream.length} >>\nstream\n${textStream}\nendstream`,
            5: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
        };

        let pdf = '%PDF-1.4\n';
        const offsets = [0];

        for (let i = 1; i <= 5; i += 1) {
            offsets.push(pdf.length);
            pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
        }

        const xrefStart = pdf.length;
        pdf += `xref\n0 6\n0000000000 65535 f \n`;
        for (let i = 1; i <= 5; i += 1) {
            pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
        }
        pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

        return new Blob([pdf], { type: 'application/pdf' });
    };

    document.querySelectorAll('#view-reportes .table-card').forEach((card) => {
        const title = card.querySelector('h3')?.textContent || '';
        const badge = card.querySelector('.risk-badge') || card.querySelector('span');
        const statusText = badge?.textContent?.trim() || '';
        const riskLevel = getRiskLevel(statusText);

        card.classList.add({
            alert: 'risk-alert',
            warning: 'risk-warning',
            low: 'risk-low',
            safe: 'risk-safe'
        }[riskLevel]);

        if (badge) {
            applyRiskStyle(badge, statusText);
        }

        const pdfButton = card.querySelector('.report-pdf-btn');
        if (pdfButton) {
            pdfButton.dataset.grade = title;
            pdfButton.dataset.status = statusText;
            pdfButton.dataset.summary = card.querySelector('p')?.textContent || 'Reporte del curso preparado por PREZEN.';
        }
    });

    document.querySelectorAll('.report-pdf-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const grade = button.dataset.grade || 'Reporte del curso';
            const status = button.dataset.status || 'Sin riesgo';
            const summary = button.dataset.summary || 'Reporte generado por PREZEN';
            const pdfBlob = createPdfBlob({ grade, status, summary });
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${grade.replace(/\s+/g, '_')}_${status.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    });

    const closeReportDetail = () => {
        if (reportDetailModal) reportDetailModal.style.display = 'none';
    };

    document.querySelectorAll('.report-details-btn').forEach(button => {
        button.addEventListener('click', () => {
            openReportDetail(
                button.dataset.grade || 'Reporte',
                button.dataset.status || 'Mensual',
                button.dataset.summary || 'Detalle no disponible.'
            );
        });
    });

    if (closeReportDetailBtn) closeReportDetailBtn.addEventListener('click', closeReportDetail);
    if (closeReportDetailSecondaryBtn) closeReportDetailSecondaryBtn.addEventListener('click', closeReportDetail);
    if (reportDetailModal) {
        reportDetailModal.addEventListener('click', (event) => {
            if (event.target === reportDetailModal) closeReportDetail();
        });
    }

    // Profile Dropdown logic
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileMenuItem = document.getElementById('profileMenuItem');
    const profileModal = document.getElementById('profileModal');
    const profileSummaryView = document.getElementById('profileSummaryView');
    const profileEditView = document.getElementById('profileEditView');
    const profileModalImageInput = document.getElementById('profileModalImageInput');
    const profileCameraBtn = document.getElementById('profileCameraBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileSecondaryBtn = document.getElementById('editProfileSecondaryBtn');
    const saveProfilePhotoBtn = document.getElementById('saveProfilePhotoBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const profileModalAvatar = document.getElementById('profileModalAvatar');
    const profileSummaryAvatar = document.getElementById('profileSummaryAvatar');
    const profileMiniAvatar = document.getElementById('profileMiniAvatar');
    const profileNameInput = document.getElementById('profileNameInput');
    const profileEmailInput = document.getElementById('profileEmailInput');
    const profilePhoneInput = document.getElementById('profilePhoneInput');
    const profileEditPhoneInput = document.getElementById('profileEditPhoneInput');
    const profileEditEmailInput = document.getElementById('profileEditEmailInput');
    const profileEditNameInput = document.getElementById('profileEditNameInput');
    const profileSummaryName = document.getElementById('profileSummaryName');
    const profileSummaryEmail = document.getElementById('profileSummaryEmail');
    const profileSummaryPhone = document.getElementById('profileSummaryPhone');
    const profileSummaryArea = document.getElementById('profileSummaryArea');
    const coordinatorHeaderName = document.getElementById('coordinatorHeaderName');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const closeProfileModalSummaryBtn = document.getElementById('closeProfileModalSummaryBtn');
    const closeProfileModalSecondaryBtn = document.getElementById('closeProfileModalSecondaryBtn');

    const updateProfileAvatars = (src) => {
        const avatarTargets = document.querySelectorAll('.avatar-wrapper img, #profileModalAvatar, #profileMiniAvatar, #profileSummaryAvatar');
        avatarTargets.forEach(img => {
            if (img) img.src = src;
        });
    };

    const updateProfileName = (name) => {
        if (profileSummaryName) profileSummaryName.textContent = name;
        if (profileEditNameInput) profileEditNameInput.value = name;
        if (coordinatorHeaderName) coordinatorHeaderName.textContent = name.startsWith('Lic.') ? name : `Lic. ${name}`;
    };

    try {
        const savedProfileData = JSON.parse(localStorage.getItem('coordsProfileData') || '{}');
        if (savedProfileData.fotoBase64) updateProfileAvatars(savedProfileData.fotoBase64);
        if (savedProfileData.nombre) updateProfileName(savedProfileData.nombre);
        if (profileEditNameInput) profileEditNameInput.value = savedProfileData.nombre || 'Carlos Ruiz';
        if (profileEditPhoneInput) profileEditPhoneInput.value = '+57 3195854419';
        if (profileSummaryEmail) profileSummaryEmail.textContent = 'coord.guarin@prezen.edu.co';
        if (profileSummaryPhone) profileSummaryPhone.textContent = '+57 3195854419';
        if (profileSummaryArea) profileSummaryArea.textContent = 'Grupo 7°B';
    } catch (err) {
        console.error('No se pudieron cargar los datos del perfil', err);
    }

    const openProfileModal = () => {
        if (!profileModal) return;
        if (profileEditNameInput && profileSummaryName) {
            profileEditNameInput.value = profileSummaryName.textContent.trim();
        }
        if (profileEditPhoneInput) profileEditPhoneInput.value = '+57 3195854419';
        if (profileModalImageInput) delete profileModalImageInput.dataset.selectedImage;
        setProfileEditMode(false);
        profileModal.style.display = 'flex';
        profileModal.setAttribute('aria-hidden', 'false');
    };

    const closeProfileModal = () => {
        if (!profileModal) return;
        if (profileModalImageInput) delete profileModalImageInput.dataset.selectedImage;
        if (profileEditNameInput && profileSummaryName) profileEditNameInput.value = profileSummaryName.textContent.trim();
        if (profileMiniAvatar && profileSummaryAvatar) profileMiniAvatar.src = profileSummaryAvatar.src;
        setProfileEditMode(false);
        profileModal.style.display = 'none';
        profileModal.setAttribute('aria-hidden', 'true');
    };

    if (profileMenuItem && profileModal) {
        profileMenuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown?.classList.remove('active');
            userProfileBtn?.classList.remove('active');
            openProfileModal();
        });
    }

    const setProfileEditMode = (enabled) => {
        if (profileSummaryView) profileSummaryView.style.display = enabled ? 'none' : 'block';
        if (profileEditView) profileEditView.style.display = enabled ? 'block' : 'none';
        if (profileCameraBtn) profileCameraBtn.style.display = enabled ? 'flex' : 'none';
        if (editProfileSecondaryBtn) editProfileSecondaryBtn.style.display = 'none';
        if (profileEditPhoneInput) {
            profileEditPhoneInput.readOnly = true;
            profileEditPhoneInput.disabled = false;
            profileEditPhoneInput.style.pointerEvents = 'none';
            profileEditPhoneInput.style.cursor = 'not-allowed';
        }
        if (profileEditEmailInput) {
            profileEditEmailInput.readOnly = true;
            profileEditEmailInput.disabled = true;
            profileEditEmailInput.style.pointerEvents = 'none';
            profileEditEmailInput.style.cursor = 'not-allowed';
        }
    };

    if (editProfileBtn || editProfileSecondaryBtn) {
        const triggerEditProfile = () => setProfileEditMode(true);
        editProfileBtn?.addEventListener('click', triggerEditProfile);
        editProfileSecondaryBtn?.addEventListener('click', triggerEditProfile);
    }

    if (profileCameraBtn && profileModalImageInput) {
        profileCameraBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            profileModalImageInput.click();
        });
    }

    if (profileModalImageInput) {
        profileModalImageInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('Selecciona una imagen válida para tu foto de perfil.');
                profileModalImageInput.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('La foto debe pesar menos de 5 MB.');
                profileModalImageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const result = loadEvent.target?.result;
                if (!result) return;
                if (profileMiniAvatar) profileMiniAvatar.src = result;
                profileModalImageInput.dataset.selectedImage = result;
                profileModalImageInput.value = '';
            };
            reader.onerror = () => {
                alert('No se pudo leer la imagen. Selecciona otro archivo e inténtalo de nuevo.');
            };
            reader.readAsDataURL(file);
        });
    }

    if (saveProfilePhotoBtn) {
        saveProfilePhotoBtn.addEventListener('click', () => {
            const nextName = profileEditNameInput?.value?.trim() || '';
            if (!nextName) {
                alert('Escribe el nombre del coordinador antes de guardar.');
                profileEditNameInput?.focus();
                return;
            }
            const selectedImage = profileModalImageInput?.dataset.selectedImage;
            try {
                const savedData = JSON.parse(localStorage.getItem('coordsProfileData') || '{}');
                savedData.nombre = nextName;
                if (selectedImage) savedData.fotoBase64 = selectedImage;
                localStorage.setItem('coordsProfileData', JSON.stringify(savedData));
                updateProfileName(nextName);
                if (selectedImage) updateProfileAvatars(selectedImage);
                if (profilePhoneInput) profilePhoneInput.value = '+57 3195854419';
                if (profileEditPhoneInput) profileEditPhoneInput.value = '+57 3195854419';
                if (profileModalImageInput) delete profileModalImageInput.dataset.selectedImage;
                setProfileEditMode(false);
                closeProfileModal();
            } catch (err) {
                console.error('No se pudieron guardar los datos del perfil', err);
                alert('No se pudieron guardar los cambios del perfil. Revisa el almacenamiento del navegador e inténtalo de nuevo.');
            }
        });
    }

    if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', () => {
        if (profileModalImageInput) delete profileModalImageInput.dataset.selectedImage;
        if (profileEditNameInput && profileSummaryName) profileEditNameInput.value = profileSummaryName.textContent.trim();
        if (profileMiniAvatar && profileSummaryAvatar) profileMiniAvatar.src = profileSummaryAvatar.src;
        setProfileEditMode(false);
        closeProfileModal();
    });
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeProfileModal);
    if (closeProfileModalSummaryBtn) closeProfileModalSummaryBtn.addEventListener('click', closeProfileModal);
    if (closeProfileModalSecondaryBtn) closeProfileModalSecondaryBtn.addEventListener('click', closeProfileModal);
    if (profileModal) {
        profileModal.addEventListener('click', (event) => {
            if (event.target === profileModal) closeProfileModal();
        });
    }

    if (profileNameInput) profileNameInput.readOnly = true;
    if (profileEmailInput) profileEmailInput.readOnly = true;
    if (profilePhoneInput) profilePhoneInput.readOnly = true;
    if (profileEditEmailInput) {
        profileEditEmailInput.readOnly = true;
        profileEditEmailInput.disabled = true;
    }
    if (profileEditPhoneInput) {
        profileEditPhoneInput.readOnly = true;
        profileEditPhoneInput.disabled = false;
    }

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
                notificationCountBadge.style.display = mockNotifications.length > 0 ? 'grid' : 'none';
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
    const statusBadge = document.getElementById('displayScanStatus');
    
    let html5QrCode;

    function updateLastProcessedRecord(studentName, status = 'PENDIENTE', statusClass = 'scan-badge') {
        const nameEl = document.getElementById('displayScanName');
        const dateEl = document.getElementById('displayScanDate');
        const timeEl = document.getElementById('displayScanTime');
        const statusEl = document.getElementById('displayScanStatus');

        const now = new Date();

        if (nameEl) nameEl.textContent = studentName;
        if (dateEl) dateEl.textContent = now.toLocaleDateString();
        if (timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.className = `scan-badge ${statusClass}`;
        }
    }

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
                    console.log(`Code matched = ${decodedText}`, decodedResult);
                    const nombre = `María Escobedo (ID: ${decodedText})`;
                    updateLastProcessedRecord(nombre, 'PUNTUAL', 'text-success');
                    alert(`¡ASISTENCIA REGISTRADA!\nEstudiante ID: ${decodedText}\nHora: ${new Date().toLocaleTimeString()}`);

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

    const btnScanHuella = document.getElementById('btnScanHuella');
    const btnAsistenciaManual = document.getElementById('btnAsistenciaManual');

    if (btnScanHuella) {
        btnScanHuella.addEventListener('click', () => {
            const nombre = prompt('Ingrese el nombre del estudiante para registrar la asistencia', 'Ana López');
            if (!nombre || !nombre.trim()) return;
            updateLastProcessedRecord(nombre.trim(), 'PUNTUAL', 'text-success');
            alert(`Asistencia registrada por huella para ${nombre.trim()}`);
        });
    }

    if (btnAsistenciaManual) {
        btnAsistenciaManual.addEventListener('click', () => {
            const nombre = prompt('Nombre del estudiante', 'María Escobedo');
            if (!nombre || !nombre.trim()) return;

            const estado = prompt('Estado de asistencia (PUNTUAL / TARDE / AUSENTE)', 'PUNTUAL');
            const estadoNormalizado = (estado || 'PUNTUAL').trim().toUpperCase();
            const estadoMap = {
                PUNTUAL: ['PUNTUAL', 'text-success'],
                TARDE: ['TARDE', 'text-warning'],
                AUSENTE: ['AUSENTE', 'text-danger']
            };

            const [estadoFinal, claseFinal] = estadoMap[estadoNormalizado] || ['PUNTUAL', 'text-success'];
            updateLastProcessedRecord(nombre.trim(), estadoFinal, claseFinal);

            alert(`Asistencia manual registrada para ${nombre.trim()} con estado ${estadoFinal}`);
        });
    }

    const attendanceTableBody = document.getElementById('attendanceControlTableBody');
    const exportAttendanceBtn = document.getElementById('exportAttendanceBtn');
    const toggleAttendanceFiltersBtn = document.getElementById('toggleAttendanceFiltersBtn');
    const attendanceFilterPanel = document.getElementById('attendanceFilterPanel');
    const attendanceGradeFilter = document.getElementById('attendanceGradeFilter');
    const attendanceStatusFilter = document.getElementById('attendanceStatusFilter');
    const attendanceNameFilter = document.getElementById('attendanceNameFilter');
    const clearAttendanceFiltersBtn = document.getElementById('clearAttendanceFiltersBtn');

    const attendanceRows = attendanceTableBody ? [...attendanceTableBody.querySelectorAll('tr')] : [];
    const attendanceCellText = (row, index) => row.cells[index]?.textContent.trim().toLowerCase() || '';

    if (attendanceGradeFilter) {
        [...new Set(attendanceRows.map(row => row.cells[0]?.textContent.trim()).filter(Boolean))]
            .sort()
            .forEach(grade => {
                const option = document.createElement('option');
                option.value = grade.toLowerCase();
                option.textContent = grade;
                attendanceGradeFilter.appendChild(option);
            });
    }

    const applyAttendanceFilters = () => {
        const grade = attendanceGradeFilter?.value || '';
        const status = attendanceStatusFilter?.value || '';
        const name = attendanceNameFilter?.value.trim().toLowerCase() || '';

        attendanceRows.forEach(row => {
            const matches = (!grade || attendanceCellText(row, 0) === grade)
                && (!status || attendanceCellText(row, 5).includes(status))
                && (!name || attendanceCellText(row, 1).includes(name));
            row.hidden = !matches;
        });
    };

    [attendanceGradeFilter, attendanceStatusFilter, attendanceNameFilter].forEach(field => {
        field?.addEventListener('input', applyAttendanceFilters);
        field?.addEventListener('change', applyAttendanceFilters);
    });

    toggleAttendanceFiltersBtn?.addEventListener('click', () => {
        if (!attendanceFilterPanel) return;
        const shouldShow = attendanceFilterPanel.hidden;
        attendanceFilterPanel.hidden = !shouldShow;
        toggleAttendanceFiltersBtn.setAttribute('aria-expanded', String(shouldShow));
    });

    clearAttendanceFiltersBtn?.addEventListener('click', () => {
        if (attendanceGradeFilter) attendanceGradeFilter.value = '';
        if (attendanceStatusFilter) attendanceStatusFilter.value = '';
        if (attendanceNameFilter) attendanceNameFilter.value = '';
        applyAttendanceFilters();
        if (attendanceFilterPanel) attendanceFilterPanel.hidden = true;
        toggleAttendanceFiltersBtn?.setAttribute('aria-expanded', 'false');
    });

    exportAttendanceBtn?.addEventListener('click', () => {
        const visibleRows = attendanceRows.filter(row => !row.hidden);
        const headers = [...attendanceTableBody.closest('table').querySelectorAll('thead th')]
            .map(header => header.textContent.trim());
        const csvRows = [headers, ...visibleRows.map(row => [...row.cells].map(cell => cell.textContent.trim()))];
        const csv = csvRows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `asistencia_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });

    const communicationMessages = [...document.querySelectorAll('#view-comunicaciones .msg-item')];
    const communicationDetailTitle = document.getElementById('communicationDetailTitle');
    const communicationDetailSender = document.getElementById('communicationDetailSender');
    const communicationDetailEmail = document.getElementById('communicationDetailEmail');
    const communicationDetailTime = document.getElementById('communicationDetailTime');
    const communicationDetailAvatar = document.getElementById('communicationDetailAvatar');
    const communicationDetailBody = document.getElementById('communicationDetailBody');
    const communicationReplyInput = document.getElementById('communicationReplyInput');
    const sendCommunicationReplyBtn = document.getElementById('sendCommunicationReplyBtn');
    const communicationFileInput = document.getElementById('communicationFileInput');
    const communicationImageInput = document.getElementById('communicationImageInput');
    const communicationFileButton = document.getElementById('communicationFileButton');
    const communicationImageButton = document.getElementById('communicationImageButton');
    const communicationAttachmentName = document.getElementById('communicationAttachmentName');
    const communicationImagePreview = document.getElementById('communicationImagePreview');
    const communicationAttachment = document.getElementById('communicationAttachment');
    const communicationAttachmentIcon = document.getElementById('communicationAttachmentIcon');
    const communicationAttachmentTitle = document.getElementById('communicationAttachmentTitle');
    const communicationAttachmentSize = document.getElementById('communicationAttachmentSize');
    const communicationSearch = document.querySelector('#view-comunicaciones input[placeholder="Buscar mensajes..."]');
    const composeCommunicationBtn = document.getElementById('composeCommunicationBtn');
    const communicationComposeModal = document.getElementById('communicationComposeModal');
    const communicationComposeForm = document.getElementById('communicationComposeForm');
    const closeCommunicationComposeBtn = document.getElementById('closeCommunicationComposeBtn');
    const cancelCommunicationComposeBtn = document.getElementById('cancelCommunicationComposeBtn');
    const composeRecipientInput = document.getElementById('composeRecipientInput');
    const composeSubjectInput = document.getElementById('composeSubjectInput');
    const composeBodyInput = document.getElementById('composeBodyInput');
    const composeAttachmentInput = document.getElementById('composeAttachmentInput');
    const composeAttachmentName = document.getElementById('composeAttachmentName');
    const communicationPreviewModal = document.getElementById('communicationPreviewModal');
    const communicationPreviewImage = document.getElementById('communicationPreviewImage');
    const closeCommunicationPreviewBtn = document.getElementById('closeCommunicationPreviewBtn');
    let selectedCommunicationImageData = '';
    let communicationAttachmentData = '';

    const createPdfPreview = (fileName, sender) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#e8eef7"/><rect x="70" y="45" width="760" height="510" rx="18" fill="white" stroke="#b8c6d9" stroke-width="4"/><rect x="70" y="45" width="760" height="92" rx="18" fill="#172554"/><text x="115" y="103" font-family="Arial" font-size="30" font-weight="bold" fill="white">REPORTE DE CONVIVENCIA</text><text x="115" y="205" font-family="Arial" font-size="28" font-weight="bold" fill="#1e3a5f">Curso 8°A</text><text x="115" y="265" font-family="Arial" font-size="22" fill="#475569">Remitente: ${sender}</text><line x1="115" y1="310" x2="785" y2="310" stroke="#cbd5e1" stroke-width="3"/><text x="115" y="370" font-family="Arial" font-size="22" fill="#64748b">Seguimiento de situación de convivencia</text><text x="115" y="420" font-family="Arial" font-size="20" fill="#64748b">Archivo: ${fileName}</text><text x="115" y="490" font-family="Arial" font-size="18" fill="#94a3b8">Vista previa del documento adjunto</text></svg>`)}`;

    const renderCommunicationBody = (body) => {
        if (!communicationDetailBody) return;
        communicationDetailBody.replaceChildren();
        body.split('|').forEach((paragraph, index) => {
            if (index > 0) communicationDetailBody.appendChild(document.createElement('br'));
            const node = document.createElement('p');
            node.textContent = paragraph;
            communicationDetailBody.appendChild(node);
        });
    };

    const selectCommunicationMessage = (message) => {
        if (!message) return;
        communicationMessages.forEach(item => item.classList.toggle('active-message', item === message));
        const data = message.dataset;
        if (communicationDetailTitle) communicationDetailTitle.textContent = data.title || 'Mensaje';
        if (communicationDetailSender) communicationDetailSender.textContent = data.sender || '';
        if (communicationDetailEmail) communicationDetailEmail.textContent = data.email || '';
        if (communicationDetailTime) communicationDetailTime.textContent = data.time || '';
        if (communicationDetailAvatar) communicationDetailAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.avatar || data.sender || 'Usuario')}&background=random&color=fff`;
        renderCommunicationBody(data.body || 'Sin contenido.');
        if (communicationAttachmentTitle) communicationAttachmentTitle.textContent = data.attachmentName || 'Sin adjunto';
        if (communicationAttachmentSize) communicationAttachmentSize.textContent = data.attachmentType === 'image' ? 'Abrir vista previa' : 'Archivo adjunto';
        if (communicationAttachmentIcon) communicationAttachmentIcon.className = data.attachmentType === 'image' ? 'fa-solid fa-file-image' : 'fa-solid fa-file-pdf';
        communicationAttachmentData = data.attachmentData || data.attachmentUrl || (data.attachmentType === 'image'
            ? createPdfPreview(data.attachmentName || 'justificante.svg', data.sender || 'Familia')
            : '');
        if (data.attachmentType === 'file' && data.attachmentName) {
            communicationAttachmentData = createPdfPreview(data.attachmentName, data.sender || 'Coordinación');
        }
        if (communicationReplyInput) communicationReplyInput.value = '';
        if (communicationAttachmentName) communicationAttachmentName.textContent = '';
        selectedCommunicationImageData = '';
        if (communicationImagePreview) {
            communicationImagePreview.hidden = true;
            communicationImagePreview.removeAttribute('src');
        }
    };

    const openCommunicationAttachment = () => {
        if (!communicationAttachmentData) return;
        const isImageData = communicationAttachmentData.startsWith('data:image/');
        const isImageFile = /\.(svg|png|jpe?g|gif|webp)(?:[?#].*)?$/i.test(communicationAttachmentData);
        if (isImageData || isImageFile) {
            if (communicationPreviewImage) communicationPreviewImage.src = communicationAttachmentData;
            if (communicationPreviewModal) communicationPreviewModal.hidden = false;
        }
    };

    communicationAttachment?.addEventListener('click', openCommunicationAttachment);
    communicationAttachment?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') openCommunicationAttachment();
    });

    const closeCommunicationPreview = () => {
        if (communicationPreviewModal) communicationPreviewModal.hidden = true;
        if (communicationPreviewImage) communicationPreviewImage.removeAttribute('src');
    };

    closeCommunicationPreviewBtn?.addEventListener('click', closeCommunicationPreview);
    communicationPreviewModal?.addEventListener('click', event => {
        if (event.target === communicationPreviewModal) closeCommunicationPreview();
    });

    const closeComposeModal = () => {
        if (communicationComposeModal) communicationComposeModal.hidden = true;
    };

    composeCommunicationBtn?.addEventListener('click', () => {
        if (communicationComposeModal) communicationComposeModal.hidden = false;
        composeRecipientInput?.focus();
    });
    closeCommunicationComposeBtn?.addEventListener('click', closeComposeModal);
    cancelCommunicationComposeBtn?.addEventListener('click', closeComposeModal);
    composeAttachmentInput?.addEventListener('change', () => {
        if (composeAttachmentName) composeAttachmentName.textContent = composeAttachmentInput.files?.[0]?.name || '';
    });

    communicationComposeForm?.addEventListener('submit', event => {
        event.preventDefault();
        const attachment = composeAttachmentInput?.files?.[0];
        const message = document.createElement('div');
        message.className = 'msg-item';
        message.dataset.messageId = `new-${Date.now()}`;
        message.dataset.title = composeSubjectInput.value.trim();
        message.dataset.sender = 'Coordinación';
        message.dataset.email = composeRecipientInput.value.trim();
        message.dataset.time = 'Ahora';
        message.dataset.avatar = 'Coordinacion';
        message.dataset.body = composeBodyInput.value.trim();
        message.dataset.attachmentName = attachment?.name || '';
        message.dataset.attachmentType = attachment?.type?.startsWith('image/') ? 'image' : 'file';
        if (attachment?.type?.startsWith('image/')) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                message.dataset.attachmentData = typeof reader.result === 'string' ? reader.result : '';
                if (message.classList.contains('active-message')) selectCommunicationMessage(message);
            });
            reader.readAsDataURL(attachment);
        }
        message.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><strong>Coordinación</strong><span>Ahora</span></div><div style="font-size:13px;font-weight:600">${composeSubjectInput.value.trim()}</div><div style="font-size:12px;color:var(--text-gray)">${composeBodyInput.value.trim()}</div>`;
        document.querySelector('#view-comunicaciones .table-card:first-child > div:nth-child(2)')?.prepend(message);
        message.addEventListener('click', () => selectCommunicationMessage(message));
        selectCommunicationMessage(message);
        communicationComposeForm.reset();
        if (composeAttachmentName) composeAttachmentName.textContent = '';
        closeComposeModal();
    });

    communicationMessages.forEach(message => {
        message.addEventListener('click', () => selectCommunicationMessage(message));
    });

    selectCommunicationMessage(document.querySelector('#view-comunicaciones .msg-item.active-message'));

    communicationSearch?.addEventListener('input', () => {
        const query = communicationSearch.value.trim().toLowerCase();
        communicationMessages.forEach(message => {
            message.hidden = query && !message.textContent.toLowerCase().includes(query);
        });
    });

    communicationFileButton?.addEventListener('click', () => communicationFileInput?.click());
    communicationImageButton?.addEventListener('click', () => communicationImageInput?.click());

    const showSelectedAttachment = (input) => {
        const file = input?.files?.[0];
        if (!file || !communicationAttachmentName) return;
        communicationAttachmentName.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
        communicationAttachmentName.title = file.name;
    };

    communicationFileInput?.addEventListener('change', () => showSelectedAttachment(communicationFileInput));
    communicationImageInput?.addEventListener('change', () => {
        const file = communicationImageInput.files?.[0];
        showSelectedAttachment(communicationImageInput);
        if (!file || !communicationImagePreview) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            selectedCommunicationImageData = typeof reader.result === 'string' ? reader.result : '';
            communicationImagePreview.src = selectedCommunicationImageData;
            communicationImagePreview.hidden = !selectedCommunicationImageData;
        });
        reader.readAsDataURL(file);
    });

    sendCommunicationReplyBtn?.addEventListener('click', () => {
        const response = communicationReplyInput?.value.trim() || '';
        const file = communicationFileInput?.files?.[0] || communicationImageInput?.files?.[0];
        if (!response && !file) {
            communicationReplyInput?.focus();
            return;
        }

        const reply = document.createElement('p');
        reply.className = 'communication-sent-reply';
        reply.textContent = `Respuesta enviada: ${response || 'Adjunto enviado.'}${file ? ` [${file.name}]` : ''}`;
        communicationDetailBody?.appendChild(document.createElement('br'));
        communicationDetailBody?.appendChild(reply);
        if (selectedCommunicationImageData && communicationDetailBody) {
            const sentImage = document.createElement('img');
            sentImage.src = selectedCommunicationImageData;
            sentImage.alt = `Imagen enviada: ${file.name}`;
            sentImage.className = 'communication-sent-image';
            communicationDetailBody.appendChild(sentImage);
        }
        if (communicationReplyInput) communicationReplyInput.value = '';
        if (communicationFileInput) communicationFileInput.value = '';
        if (communicationImageInput) communicationImageInput.value = '';
        if (communicationAttachmentName) communicationAttachmentName.textContent = '';
        selectedCommunicationImageData = '';
        if (communicationImagePreview) {
            communicationImagePreview.hidden = true;
            communicationImagePreview.removeAttribute('src');
        }
        sendCommunicationReplyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Enviada';
        setTimeout(() => {
            sendCommunicationReplyBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:8px;"></i> Enviar Respuesta';
        }, 1800);
    });

});
