(function () {
    const MODE_KEY = 'prezen_local_demo';
    const PROFILE_KEY = 'prezen_profile';
    const SENT_MESSAGES_KEY = 'prezen_local_demo_messages';
    const GROUP = {
        id: 7,
        nombre: '7°B',
        jornada: 'Mañana',
        anio_lectivo: String(new Date().getFullYear()),
        director_usuario_id: 'demo-director',
    };
    const DEFAULT_PROFILE = {
        id: 'demo-director',
        nombre: 'Prof. García',
        email: 'director@prezen.demo',
        rol: 'director_grupo',
        telefono: '+57 320 123 4567',
        avatar_url: null,
        estado: 'activo',
    };
    const INBOX_MESSAGES = [
        {
            id: 'demo-inbox-medical',
            remitente_usuario_id: 'demo-caregiver-1',
            remitente: 'María Gómez (Mamá de Ana López)',
            destinatario: DEFAULT_PROFILE.nombre,
            asunto: 'Justificación de falta médica',
            contenido: 'Adjunto el certificado médico de Ana López para justificar su inasistencia.',
            estudiante: 'Ana López',
        },
        {
            id: 'demo-inbox-incident',
            remitente_usuario_id: 'demo-coordinator-1',
            remitente: 'Prof. Luis Rojas',
            destinatario: DEFAULT_PROFILE.nombre,
            asunto: 'Seguimiento del grupo 7°B',
            contenido: 'Coordinemos el seguimiento de asistencia y convivencia del grupo esta semana.',
            estudiante: '',
        },
    ];

    function activeStorage() {
        return localStorage.getItem(MODE_KEY) === 'true'
            ? localStorage
            : sessionStorage.getItem(MODE_KEY) === 'true' ? sessionStorage : null;
    }

    function isActive() {
        return activeStorage() !== null;
    }

    function profileFromStorage() {
        const storage = activeStorage();
        if (!storage) throw new Error('La sesión de demostración local no está activa.');
        const saved = storage.getItem(PROFILE_KEY);
        return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : { ...DEFAULT_PROFILE };
    }

    function saveProfile(profile) {
        const storage = activeStorage();
        if (!storage) throw new Error('La sesión de demostración local no está activa.');
        storage.setItem(PROFILE_KEY, JSON.stringify(profile));
        return profile;
    }

    function getStudents() {
        const sampleStudents = Array.isArray(window.prezenDemoStudents) ? window.prezenDemoStudents : [];
        if (!sampleStudents.length) {
            throw new Error('No se encontraron los estudiantes de muestra para el dashboard local.');
        }
        return sampleStudents.map(([nombre], index) => ({
            id: `demo-student-${String(index + 1).padStart(2, '0')}`,
            nombre,
            estado: 'activo',
            grupo_id: GROUP.id,
            grupo: GROUP.nombre,
            jornada: GROUP.jornada,
        }));
    }

    function localDate(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function getAttendance(students) {
        const now = new Date();
        const dates = [];
        for (let day = 1; day <= now.getDate(); day += 1) {
            const date = new Date(now.getFullYear(), now.getMonth(), day);
            if (date.getDay() !== 0 && date.getDay() !== 6) dates.push(localDate(now.getFullYear(), now.getMonth() + 1, day));
        }
        const today = localDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
        if (!dates.includes(today)) dates.push(today);
        const statuses = ['presente', 'presente', 'presente', 'presente', 'ausente', 'tardanza'];
        const attendance = [];
        dates.slice(-8).forEach((date, dateIndex) => {
            students.forEach((student, studentIndex) => {
                const sampleStatus = window.prezenDemoStudents[studentIndex]?.[1]?.toLocaleLowerCase('es-CO');
                const state = date === today
                    ? (sampleStatus === 'ausente' ? 'ausente' : sampleStatus === 'tardanza' ? 'tardanza' : 'presente')
                    : statuses[(studentIndex + dateIndex * 2) % statuses.length];
                attendance.push({
                    sesion_id: `demo-session-${date}`,
                    estudiante_usuario_id: student.id,
                    estado: state,
                    hora_registro: `${String(7 + (studentIndex % 2)).padStart(2, '0')}:${String((studentIndex * 7) % 60).padStart(2, '0')}:00`,
                    fecha: date,
                    tipo: 'entrada',
                    estudiante: student.nombre,
                });
            });
        });
        return attendance;
    }

    function getDashboard() {
        const profile = profileFromStorage();
        const students = getStudents();
        const attendance = getAttendance(students);
        const today = localDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        const todayRecords = attendance.filter((record) => record.fecha === today);
        return {
            profile,
            groups: [{ ...GROUP }],
            students,
            attendance,
            notifications: [
                { id: 'demo-notification-1', contenido: 'Recibiste una justificación médica para Ana López.', leida: false },
                { id: 'demo-notification-2', contenido: 'Carlos Ramírez tiene una inasistencia pendiente por revisar.', leida: false },
                { id: 'demo-notification-3', contenido: 'Hay una tardanza registrada hoy en el grupo 7°B.', leida: true },
            ],
            totals: {
                students: students.length,
                present: todayRecords.filter((record) => record.estado === 'presente').length,
                absent: todayRecords.filter((record) => record.estado === 'ausente').length,
                late: todayRecords.filter((record) => record.estado === 'tardanza').length,
            },
        };
    }

    function getContacts() {
        return getStudents().map((student) => ({
            estudiante_id: student.id,
            estudiante_usuario_id: student.id,
            estudiante: student.nombre,
            grupo_id: GROUP.id,
            grupo: GROUP.nombre,
        }));
    }

    function storedMessages() {
        const saved = localStorage.getItem(SENT_MESSAGES_KEY);
        if (!saved) return [];
        const messages = JSON.parse(saved);
        if (!Array.isArray(messages)) throw new Error('Los mensajes locales guardados tienen un formato inválido.');
        return messages;
    }

    function createReport(params) {
        const month = params.get('month') || new Date().toISOString().slice(0, 7);
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('El mes seleccionado no es válido.');
        const period = Number(params.get('period') || 1);
        const week = params.get('week');
        const [year, monthNumber] = month.split('-').map(Number);
        const daysInMonth = new Date(year, monthNumber, 0).getDate();
        const series = [];
        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, monthNumber - 1, day);
            const weekNumber = Math.ceil(day / 7);
            if (date.getDay() === 0 || date.getDay() === 6 || (week && week !== 'all' && weekNumber !== Number(week))) continue;
            const variation = (day + period * 3 + weekNumber * 2) % 7;
            series.push({
                date: localDate(year, monthNumber, day),
                present: 22 + variation,
                absent: 1 + ((day + period) % 4),
                late: (day + period) % 3,
            });
        }
        const summary = series.reduce((totals, day) => ({
            present: totals.present + day.present,
            absent: totals.absent + day.absent,
            late: totals.late + day.late,
        }), { present: 0, absent: 0, late: 0 });
        const absentStudents = Math.min(4, summary.absent);
        return {
            month,
            period,
            week: week && week !== 'all' ? Number(week) : null,
            groups: [{ ...GROUP }],
            periods: [],
            summary: { ...summary, absentStudents, total: summary.present + summary.absent + summary.late },
            series,
        };
    }

    function parseBody(options) {
        if (!options?.body) return {};
        try {
            return JSON.parse(options.body);
        } catch {
            throw new Error('La solicitud local contiene datos inválidos.');
        }
    }

    async function request(path, options = {}) {
        if (!isActive()) throw new Error('La sesión de demostración local no está activa.');
        const [pathname, query = ''] = path.split('?');
        const method = (options.method || 'GET').toUpperCase();
        if (pathname === '/dashboard' && method === 'GET') return getDashboard();
        if (pathname === '/contacts' && method === 'GET') return getContacts();
        if (pathname === '/reports' && method === 'GET') return createReport(new URLSearchParams(query));
        if (pathname === '/messages' && method === 'GET') return [...storedMessages(), ...INBOX_MESSAGES];
        if (pathname === '/messages' && method === 'POST') {
            const body = parseBody(options);
            if (!body.asunto || !body.contenido) throw new Error('El asunto y el contenido del mensaje son obligatorios.');
            const message = {
                id: `demo-message-${Date.now()}`,
                remitente_usuario_id: profileFromStorage().id,
                remitente: profileFromStorage().nombre,
                asunto: body.asunto,
                contenido: body.contenido,
                estudiante: getStudents().find((student) => student.id === body.estudiante_id)?.nombre || '',
                destinatario: body.estudiante_id || body.grupo_id || '',
            };
            localStorage.setItem(SENT_MESSAGES_KEY, JSON.stringify([message, ...storedMessages()]));
            return [{ id: message.id }];
        }
        if (pathname === '/auth/me' && method === 'PATCH') {
            const body = parseBody(options);
            const profile = saveProfile({ ...profileFromStorage(), ...body });
            return profile;
        }
        if (pathname === '/auth/me/avatar' && method === 'POST') {
            const body = parseBody(options);
            if (typeof body.image_data !== 'string' || !body.image_data.startsWith('data:image/')) {
                throw new Error('La imagen de perfil no tiene un formato válido.');
            }
            const profile = saveProfile({ ...profileFromStorage(), avatar_url: body.image_data });
            return { avatar_url: profile.avatar_url };
        }
        throw new Error(`La acción ${method} ${pathname} no está disponible en la demostración local.`);
    }

    window.PrezenLocalDemo = {
        isActive,
        start() {
            if (!isActive()) throw new Error('No se pudo iniciar el modo de demostración local.');
            return { profile: profileFromStorage() };
        },
        request,
    };
})();
