(function () {
    const TOKEN_KEY = 'prezen_access_token';
    const PROFILE_KEY = 'prezen_profile';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    }

    function clearSession() {
        for (const storage of [localStorage, sessionStorage]) {
            storage.removeItem(TOKEN_KEY);
            storage.removeItem('prezen_refresh_token');
            storage.removeItem(PROFILE_KEY);
            storage.removeItem('prezen_local_demo');
        }
    }

    async function request(path, options, allowRefresh = true) {
        if (window.PrezenLocalDemo?.isActive()) {
            return window.PrezenLocalDemo.request(path, options);
        }
        if (window.location.protocol === 'file:') {
            throw new Error('PREZEN se abrió como archivo local. Abre http://localhost:3000 para que el frontend pueda comunicarse con el backend.');
        }
        const token = getToken();
        const response = await fetch(`/api/v1${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options && options.headers ? options.headers : {}),
            },
        });
        if (response.status === 401 && allowRefresh && !path.startsWith('/auth/')) {
            const refreshToken = localStorage.getItem('prezen_refresh_token') || sessionStorage.getItem('prezen_refresh_token');
            if (refreshToken) {
                const refreshResponse = await fetch('/api/v1/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
                const refreshed = await refreshResponse.json().catch(() => null);
                if (refreshResponse.ok && refreshed && refreshed.success) {
                    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
                    storage.setItem(TOKEN_KEY, refreshed.data.access_token);
                    storage.setItem('prezen_refresh_token', refreshed.data.refresh_token || '');
                    return request(path, options, false);
                }
            }
        }
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || !result.success) {
            const message = result && result.error ? result.error.message : 'No se pudo completar la solicitud.';
            if (response.status === 401) clearSession();
            throw new Error(message);
        }
        return result.data;
    }

    function showError(message) {
        let banner = document.getElementById('prezenConnectionError');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'prezenConnectionError';
            banner.setAttribute('role', 'alert');
            banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;padding:14px 18px;border-radius:10px;background:#fff1f2;color:#9f1239;border:1px solid #fecdd3;font:500 14px Inter,Arial,sans-serif;box-shadow:0 8px 25px rgba(15,23,42,.16)';
            document.body.appendChild(banner);
        }
        banner.textContent = `No se pudo conectar con PREZEN: ${message}`;
    }

    const api = {
        request,
        getToken,
        clearSession,
        async login(email, password, remember) {
            const response = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (!response.access_token || !response.refresh_token || !response.profile
                || !response.profile.nombre || !response.profile.rol) {
                throw new Error('El backend respondió sin los datos completos del perfil. Intenta de nuevo o contacta al administrador.');
            }
            clearSession();
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(TOKEN_KEY, response.access_token);
            storage.setItem('prezen_refresh_token', response.refresh_token || '');
            storage.setItem(PROFILE_KEY, JSON.stringify(response.profile));
            return response;
        },
        async loginLocalDemo(remember) {
            clearSession();
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('prezen_local_demo', 'true');
            storage.setItem(TOKEN_KEY, 'local-demo');
            const response = window.PrezenLocalDemo.start();
            storage.setItem(PROFILE_KEY, JSON.stringify(response.profile));
            return response;
        },
        async logout() {
            clearSession();
            window.location.href = '/auth/index.html';
        },
    };
    window.PrezenAPI = api;

    function formatName(profile) {
        return profile && profile.nombre ? profile.nombre : 'Usuario';
    }

    function monthRecords(attendance) {
        const month = new Date().toISOString().slice(0, 7);
        return attendance.filter((record) => record.fecha && record.fecha.startsWith(month) && record.tipo === 'entrada');
    }

    function renderStudents(data) {
        const tableBody = document.getElementById('studentTableBody');
        if (!tableBody || !Array.isArray(data.students)) return;
        const today = new Date().toISOString().slice(0, 10);
        const todayRecords = new Map(data.attendance.filter((record) => record.fecha === today).map((record) => [record.estudiante_usuario_id, record.estado]));
        tableBody.replaceChildren();
        for (const student of data.students) {
            const row = document.createElement('tr');
            row.className = 'student-row';
            const rawStatus = todayRecords.get(student.id);
            const status = rawStatus === 'presente' ? 'Presente' : rawStatus === 'tardanza' ? 'Tardanza' : rawStatus === 'ausente' ? 'Ausente' : 'Sin registro';
            const statusClass = rawStatus === 'presente' ? 'present' : rawStatus === 'ausente' ? 'absent' : rawStatus === 'tardanza' ? 'late' : '';
            const nameCell = document.createElement('td');
            const expandButton = document.createElement('button');
            expandButton.type = 'button';
            expandButton.className = 'student-expand-button';
            expandButton.setAttribute('aria-expanded', 'false');
            expandButton.appendChild(document.createTextNode(student.nombre));
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-chevron-down';
            icon.setAttribute('aria-hidden', 'true');
            expandButton.appendChild(icon);
            nameCell.appendChild(expandButton);
            const groupCell = document.createElement('td');
            groupCell.textContent = student.grupo;
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `student-status ${statusClass}`.trim();
            statusBadge.textContent = status;
            statusCell.appendChild(statusBadge);
            row.append(nameCell, groupCell, statusCell);
            row.addEventListener('click', () => {
                const existing = row.nextElementSibling;
                if (existing && existing.classList.contains('student-detail-row')) {
                    existing.remove();
                    row.querySelector('.student-expand-button').setAttribute('aria-expanded', 'false');
                    return;
                }
                document.querySelectorAll('.student-detail-row').forEach((detail) => detail.remove());
                const records = monthRecords(data.attendance).filter((record) => record.estudiante_usuario_id === student.id);
                const totals = {
                    presente: records.filter((record) => record.estado === 'presente').length,
                    ausente: records.filter((record) => record.estado === 'ausente').length,
                    tardanza: records.filter((record) => record.estado === 'tardanza').length,
                };
                const detail = document.createElement('tr');
                detail.className = 'student-detail-row';
                const detailCell = document.createElement('td');
                detailCell.colSpan = 3;
                detailCell.className = 'student-detail-cell';
                const details = document.createElement('div');
                details.className = 'student-details';
                const heading = document.createElement('h3');
                heading.textContent = `Asistencia registrada de ${student.nombre}`;
                const summary = document.createElement('p');
                summary.textContent = `Presentes: ${totals.presente} · Ausencias: ${totals.ausente} · Tardanzas: ${totals.tardanza}`;
                details.append(heading, summary);
                detailCell.appendChild(details);
                detail.appendChild(detailCell);
                row.after(detail);
                row.querySelector('.student-expand-button').setAttribute('aria-expanded', 'true');
            });
            tableBody.appendChild(row);
        }
        const counter = document.getElementById('studentCount');
        if (counter) counter.textContent = `${data.students.length} estudiantes`;
    }

    function renderDashboard(data) {
        window.prezenDashboard = data;
        document.dispatchEvent(new CustomEvent('prezen:dashboard-loaded', { detail: data }));
        document.querySelectorAll('[data-prezen-name]').forEach((element) => {
            element.textContent = formatName(data.profile);
        });
        document.querySelectorAll('[data-prezen-email]').forEach((element) => {
            element.textContent = data.profile.email || '';
        });
        document.querySelectorAll('[data-prezen-role]').forEach((element) => {
            element.textContent = data.profile.rol || '';
        });
        document.querySelectorAll('[data-prezen-avatar]').forEach((image) => {
            if (data.profile.avatar_url) image.src = data.profile.avatar_url;
        });
        const firstStudent = data.students[0];
        document.querySelectorAll('[data-prezen-student]').forEach((element) => {
            element.textContent = firstStudent ? firstStudent.nombre : 'Sin estudiante asociado';
        });
        const profileName = document.getElementById('profileModalName');
        const profileEmail = document.getElementById('profileModalEmail');
        const profilePhone = document.getElementById('profileModalPhone');
        const welcomeName = document.getElementById('welcomeTeacherName');
        if (profileName) profileName.textContent = formatName(data.profile);
        if (profileEmail) profileEmail.textContent = data.profile.email || '';
        if (profilePhone) profilePhone.textContent = data.profile.telefono || 'Sin teléfono registrado';
        if (welcomeName) welcomeName.textContent = formatName(data.profile).replace(/^prof(?:esor(?:a)?|\.?)\s*/i, '').trim();
        const groupLabel = document.querySelector('[data-prezen-group]');
        if (groupLabel && data.groups.length) {
            const group = data.groups[0];
            groupLabel.textContent = `Curso ${group.nombre} - Jornada ${group.jornada}`;
        }

        const monthEntries = monthRecords(data.attendance);
        const thisMonth = {
            present: monthEntries.filter((record) => record.estado === 'presente').length,
            absent: monthEntries.filter((record) => record.estado === 'ausente').length,
            late: monthEntries.filter((record) => record.estado === 'tardanza').length,
        };
        const totalEntries = thisMonth.present + thisMonth.absent + thisMonth.late;
        const punctuality = totalEntries ? Math.round((thisMonth.present / totalEntries) * 100) : 0;
        const riskStudents = data.students.filter((student) => {
            const records = monthEntries.filter((record) => record.estudiante_usuario_id === student.id);
            const absentCount = records.filter((record) => record.estado === 'ausente').length;
            const attendanceCount = records.length;
            const presentCount = records.filter((record) => record.estado === 'presente').length;
            const rate = attendanceCount ? (presentCount / attendanceCount) * 100 : 100;
            return absentCount >= 3 || rate < 85;
        }).length;
        const values = {
            students: data.totals.students,
            present: data.totals.present,
            absent: data.totals.absent,
            late: data.totals.late,
            monthPresent: thisMonth.present,
            monthAbsent: thisMonth.absent,
            monthLate: thisMonth.late,
            punctuality: `${punctuality}%`,
            attendanceRate: `${punctuality}%`,
            attendanceLevel: totalEntries ? (punctuality >= 90 ? 'Alto' : punctuality >= 75 ? 'Medio' : 'Bajo') : 'Sin datos',
            riskStudents,
        };
        document.querySelectorAll('[data-prezen-value]').forEach((element) => {
            const value = values[element.dataset.prezenValue];
            if (value !== undefined) element.textContent = String(value);
        });
        const todayLabel = document.querySelector('[data-prezen-presentes-hoy]');
        if (todayLabel) todayLabel.textContent = `${data.totals.present}/${data.totals.students}`;

        const notifications = document.querySelector('.recent-notifications');
        if (notifications) {
            notifications.replaceChildren();
            for (const item of data.notifications.slice(0, 5)) {
                const li = document.createElement('li');
                const text = document.createElement('span');
                text.textContent = item.contenido;
                li.appendChild(text);
                notifications.appendChild(li);
            }
            if (!data.notifications.length) {
                const empty = document.createElement('li');
                empty.textContent = 'No tienes notificaciones nuevas.';
                notifications.appendChild(empty);
            }
        }
        const notificationList = document.getElementById('notificationsList');
        if (notificationList) {
            notificationList.replaceChildren();
            for (const item of data.notifications.slice(0, 5)) {
                const notification = document.createElement('div');
                notification.style.cssText = 'padding:14px 18px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:13px;';
                notification.textContent = item.contenido;
                notificationList.appendChild(notification);
            }
            const badge = document.getElementById('notificationCountBadge');
            if (badge) badge.textContent = String(data.notifications.filter((item) => !item.leida).length);
        }

        renderStudents(data);
        renderFamilyTable(data);
    }

    function renderFamilyTable(data) {
        const tableBody = document.getElementById('familyStudentsTableBody');
        if (!tableBody) return;
        const entries = monthRecords(data.attendance);
        tableBody.replaceChildren();
        for (const student of data.students) {
            const records = entries.filter((record) => record.estudiante_usuario_id === student.id);
            const present = records.filter((record) => record.estado === 'presente').length;
            const late = records.filter((record) => record.estado === 'tardanza').length;
            const absent = records.filter((record) => record.estado === 'ausente').length;
            const rate = records.length ? Math.round((present / records.length) * 100) : 0;
            const row = document.createElement('tr');
            const status = document.createElement('span');
            status.className = rate >= 90 ? 'badge-excelente' : rate >= 75 ? 'badge-curso' : 'badge-risk';
            status.textContent = records.length ? (rate >= 90 ? 'Excelente' : rate >= 75 ? 'Seguimiento' : 'En riesgo') : 'Sin registros';
            [student.nombre, student.grupo, `${rate}%`, String(late), String(absent)].forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            const statusCell = document.createElement('td');
            statusCell.appendChild(status);
            row.appendChild(statusCell);
            tableBody.appendChild(row);
        }
    }

    function renderMessages(messages, profile) {
        const list = document.querySelector('.message-list');
        if (!list) return;
        list.replaceChildren();
        for (const message of messages) {
            const sent = message.remitente_usuario_id === profile.id;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'message-item';
            item.dataset.messageId = String(message.id);
            const heading = document.createElement('strong');
            heading.textContent = sent ? 'Enviado' : message.remitente || 'Mensaje recibido';
            const subject = document.createElement('span');
            subject.textContent = message.asunto;
            const summary = document.createElement('small');
            summary.textContent = message.estudiante ? `Estudiante: ${message.estudiante}` : message.contenido;
            item.append(heading, subject, summary);
            item.addEventListener('click', () => {
                list.querySelectorAll('.message-item').forEach((entry) => entry.classList.toggle('active', entry === item));
                const subjectElement = document.getElementById('messageSubject');
                const senderElement = document.getElementById('messageSender');
                const bodyElement = document.getElementById('messageBody');
                if (subjectElement) subjectElement.textContent = message.asunto;
                if (senderElement) senderElement.textContent = sent ? `Para: ${message.destinatario}` : `De: ${message.remitente}`;
                if (bodyElement) {
                    bodyElement.replaceChildren();
                    const paragraph = document.createElement('p');
                    paragraph.textContent = message.contenido;
                    bodyElement.appendChild(paragraph);
                }
            });
            list.appendChild(item);
        }
        if (!messages.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Todavía no hay comunicaciones guardadas.';
            list.appendChild(empty);
        }
    }

    async function connectDashboard() {
        if (!document.body.hasAttribute('data-prezen-dashboard')) return;
        if (document.body.dataset.requiredRole === 'director_grupo'
            && window.PrezenLocalDemo && !window.PrezenLocalDemo.isActive()) {
            try {
                await api.loginLocalDemo(true);
            } catch (error) {
                showError(error.message);
                return;
            }
        } else if (!getToken()) {
            window.location.replace('/auth/index.html');
            return;
        }
        try {
            const data = await request('/dashboard');
            const requiredRole = document.body.dataset.requiredRole;
            if (requiredRole && data.profile.rol !== requiredRole) {
                const destinations = {
                    admin: '/auth/dashboard.html',
                    coordinador: '/panel_control/coordinadores/index.html',
                    director_grupo: '/panel_control/directores_grupo/index.html',
                    padre_familia: '/panel_control/padres_familia/index.html',
                    estudiante: '/panel_control/estudiantes/index.html',
                };
                window.location.replace(destinations[data.profile.rol] || '/auth/index.html');
                return;
            }
            renderDashboard(data);
            const localDemoNotice = document.getElementById('localDemoNotice');
            if (localDemoNotice) localDemoNotice.hidden = !window.PrezenLocalDemo?.isActive();
            if (['director_grupo', 'coordinador', 'admin'].includes(data.profile.rol)) {
                const contacts = await request('/contacts');
                window.prezenContacts = contacts;
                document.dispatchEvent(new CustomEvent('prezen:contacts-loaded', { detail: contacts }));
            }
            const messages = await request('/messages');
            renderMessages(messages, data.profile);
            if (data.profile.rol === 'admin') {
                const stats = await request('/admin/stats');
                document.querySelectorAll('[data-prezen-admin-stat]').forEach((element) => {
                    const value = stats[element.dataset.prezenAdminStat];
                    if (value !== undefined) element.textContent = String(value);
                });
            }
            if (data.profile.rol === 'director_grupo' || data.profile.rol === 'admin') connectReports();
        } catch (error) {
            showError(error.message);
        }
    }

    async function connectReports() {
        const month = document.getElementById('reportMonthInput');
        const week = document.getElementById('reportWeekFilter');
        const period = document.getElementById('reportPeriodFilter');
        if (!month) return;
        const refresh = async () => {
            try {
                const params = new URLSearchParams({ month: month.value });
                if (week && week.value !== 'all') params.set('week', String(Number(week.value) + 1));
                if (period) params.set('period', String(Number(period.value) + 1));
                const report = await request(`/reports?${params.toString()}`);
                const summaryValues = {
                    monthlyAttendanceTotal: report.summary.present,
                    monthlyAbsenceTotal: report.summary.absent,
                    monthlyLateTotal: report.summary.late,
                    monthlyAbsentStudents: report.summary.absentStudents,
                };
                for (const [id, value] of Object.entries(summaryValues)) {
                    const element = document.getElementById(id);
                    if (element) element.textContent = Number(value).toLocaleString('es-CO');
                }
                const chart = document.getElementById('attendanceChart');
                if (chart) {
                    const plot = { left: 62, right: 986, top: 18, bottom: 204 };
                    const values = report.series.flatMap((day) => [day.present, day.absent, day.late]);
                    const step = Math.max(1, Math.ceil(Math.max(1, ...values) / 4));
                    const maximum = step * 4;
                    const x = (index) => report.series.length < 2
                        ? (plot.left + plot.right) / 2
                        : plot.left + index * (plot.right - plot.left) / (report.series.length - 1);
                    const y = (value) => plot.bottom - value / maximum * (plot.bottom - plot.top);
                    const grid = Array.from({ length: 5 }, (_, index) => {
                        const value = maximum - index * step;
                        const yPosition = y(value);
                        return `<line class="chart-grid-line" x1="${plot.left}" y1="${yPosition}" x2="${plot.right}" y2="${yPosition}"></line><text x="2" y="${yPosition + 4}">${value}</text>`;
                    }).join('');
                    const series = [
                        { key: 'present', className: 'attended' },
                        { key: 'absent', className: 'absences' },
                        { key: 'late', className: 'late' },
                    ];
                    const lines = series.map(({ key, className }) => {
                        const points = report.series.map((day, index) => `${x(index)},${y(day[key])}`).join(' ');
                        const dots = report.series.map((day, index) => `<circle class="chart-point ${className}" cx="${x(index)}" cy="${y(day[key])}" r="4.5"></circle>`).join('');
                        return `<polyline class="chart-line ${className}" points="${points}"></polyline>${dots}`;
                    }).join('');
                    const labels = report.series.map((day, index) => {
                        const label = new Intl.DateTimeFormat('es-CO', { day: 'numeric' }).format(new Date(`${day.date}T00:00:00`));
                        return `<text x="${x(index)}" y="${plot.bottom + 30}" text-anchor="middle">${label}</text>`;
                    }).join('');
                    chart.innerHTML = `<title id="attendanceChartTitle">Asistencia registrada en ${report.month}</title><desc id="attendanceChartDescription">${report.series.length ? 'Asistencia, ausencias y tardanzas por fecha.' : 'Sin sesiones registradas para este filtro.'}</desc>${grid}${lines}${labels}`;
                }
            } catch (error) {
                showError(error.message);
            }
        };
        month.addEventListener('change', refresh);
        week?.addEventListener('change', refresh);
        period?.addEventListener('change', refresh);
        await refresh();
    }

    document.addEventListener('DOMContentLoaded', connectDashboard);
    api.refreshDashboard = async function () {
        const data = await request('/dashboard');
        renderDashboard(data);
        return data;
    };
    document.addEventListener('click', (event) => {
        const logoutLink = event.target.closest('a[href*="auth/index.html"]');
        if (logoutLink && document.body.hasAttribute('data-prezen-dashboard')) {
            event.preventDefault();
            api.logout();
        }
    });
})();
