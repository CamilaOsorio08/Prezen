import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
  console.error('Configura SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y DEMO_PASSWORD (mínimo 8 caracteres) en src/.env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const studentNames = [
  'María Escobedo', 'Ana López', 'Carlos Ramírez', 'Juan Gómez', 'Laura Pérez', 'Diego Hernández',
  'Sofía Martínez', 'Mateo Torres', 'Valentina Castro', 'Samuel Rojas', 'Isabella Mendoza', 'Nicolás Herrera',
  'Lucía Vargas', 'Daniel Ortiz', 'Camila Jiménez', 'Sebastián Moreno', 'Manuela Silva', 'Tomás Álvarez',
  'Gabriela Ruiz', 'Emiliano Díaz', 'Juliana Romero', 'Santiago Navarro', 'Sara Medina', 'Jerónimo León',
  'Victoria Cruz', 'David Cárdenas', 'Mariana Ospina', 'Felipe Parra',
];
const demoAccounts = [
  { email: 'admin@prezen.demo', nombre: 'Administración PREZEN', rol: 'admin' },
  { email: 'coordinador@prezen.demo', nombre: 'Coordinador PREZEN', rol: 'coordinador' },
  { email: 'director@prezen.demo', nombre: 'Profesor García', rol: 'director_grupo' },
  { email: 'padre@prezen.demo', nombre: 'María Gómez', rol: 'padre_familia' },
  ...studentNames.map((nombre, index) => ({
    email: `estudiante${String(index + 1).padStart(2, '0')}@prezen.demo`,
    nombre,
    rol: 'estudiante',
  })),
];
const periods = [
  { numero: 1, fecha_inicio: '2026-02-02', fecha_fin: '2026-03-06' },
  { numero: 2, fecha_inicio: '2026-05-04', fecha_fin: '2026-06-05' },
  { numero: 3, fecha_inicio: '2026-09-07', fecha_fin: '2026-11-13' },
];

function failIfError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function findAuthUsers() {
  const users = new Map();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    failIfError(error, 'No se pudieron consultar las cuentas Auth');
    for (const user of data.users) users.set(user.email?.toLowerCase(), user);
    if (data.users.length < 1000) return users;
  }
}

async function getOrCreateAuthUser(account, authUsers) {
  const existing = authUsers.get(account.email);
  if (existing) return existing.id;
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre: account.nombre },
  });
  failIfError(error, `No se pudo crear la cuenta demo ${account.email}`);
  authUsers.set(account.email, data.user);
  return data.user.id;
}

async function ensureDemoData() {
  const { data: roles, error: rolesError } = await supabase.from('roles').select('id, nombre');
  failIfError(rolesError, 'No se pudieron cargar los roles; aplica primero las migraciones SQL');
  const roleIds = new Map((roles || []).map((role) => [role.nombre, role.id]));
  for (const account of demoAccounts) {
    if (!roleIds.has(account.rol)) throw new Error(`Falta el rol requerido: ${account.rol}`);
  }

  const authUsers = await findAuthUsers();
  const users = new Map();
  for (const account of demoAccounts) {
    users.set(account.email, await getOrCreateAuthUser(account, authUsers));
  }
  const profileRows = demoAccounts.map((account) => ({
    id: users.get(account.email),
    nombre: account.nombre,
    rol_id: roleIds.get(account.rol),
    estado: 'activo',
  }));
  const { error: profileError } = await supabase.from('usuarios').upsert(profileRows, { onConflict: 'id' });
  failIfError(profileError, 'No se pudieron crear los perfiles de demo');

  const directorId = users.get('director@prezen.demo');
  const coordinatorId = users.get('coordinador@prezen.demo');
  const { data: matchingGroups, error: groupSearchError } = await supabase.from('grupos')
    .select('id, director_usuario_id')
    .eq('nombre', '7°B')
    .eq('anio_lectivo', '2026');
  failIfError(groupSearchError, 'No se pudo buscar el grupo demo');
  if (matchingGroups.length > 1) throw new Error('Hay más de un grupo 7°B de 2026; resuelve los duplicados antes de sembrar.');
  let group = matchingGroups[0];
  if (!group) {
    const { data, error } = await supabase.from('grupos')
      .insert({ nombre: '7°B', jornada: 'mañana', anio_lectivo: '2026', director_usuario_id: directorId })
      .select('id, director_usuario_id')
      .single();
    failIfError(error, 'No se pudo crear el grupo demo');
    group = data;
  } else if (group.director_usuario_id && group.director_usuario_id !== directorId) {
    throw new Error('El grupo existente 7°B/2026 ya pertenece a otro director; no se modificó.');
  } else if (!group.director_usuario_id) {
    const { error } = await supabase.from('grupos').update({ director_usuario_id: directorId }).eq('id', group.id);
    failIfError(error, 'No se pudo asignar el director al grupo demo');
  }

  const { data: assignment, error: assignmentSearchError } = await supabase.from('coordinadores_grupo')
    .select('id')
    .eq('grupo_id', group.id)
    .eq('coordinador_usuario_id', coordinatorId)
    .maybeSingle();
  failIfError(assignmentSearchError, 'No se pudo buscar la asignación del coordinador');
  if (!assignment) {
    const { error } = await supabase.from('coordinadores_grupo').insert({ grupo_id: group.id, coordinador_usuario_id: coordinatorId });
    failIfError(error, 'No se pudo asignar el coordinador al grupo demo');
  }

  const studentIds = studentNames.map((_, index) => users.get(`estudiante${String(index + 1).padStart(2, '0')}@prezen.demo`));
  const { data: existingEnrollments, error: enrollmentSearchError } = await supabase.from('estudiantes_grupo')
    .select('estudiante_usuario_id')
    .eq('grupo_id', group.id);
  failIfError(enrollmentSearchError, 'No se pudieron consultar las matrículas demo');
  const enrolledIds = new Set((existingEnrollments || []).map((enrollment) => enrollment.estudiante_usuario_id));
  const enrollmentRows = studentIds.filter((id) => !enrolledIds.has(id)).map((id) => ({
    grupo_id: group.id,
    estudiante_usuario_id: id,
    codigo_qr: `PREZEN-${id.slice(0, 8)}`,
    estado: 'activo',
  }));
  if (enrollmentRows.length) {
    const { error } = await supabase.from('estudiantes_grupo').insert(enrollmentRows);
    failIfError(error, 'No se pudieron crear las matrículas demo');
  }

  const parentId = users.get('padre@prezen.demo');
  const mariaId = studentIds[0];
  const { data: caregiverLink, error: caregiverSearchError } = await supabase.from('acudientes_estudiante')
    .select('id')
    .eq('padre_usuario_id', parentId)
    .eq('estudiante_usuario_id', mariaId)
    .maybeSingle();
  failIfError(caregiverSearchError, 'No se pudo consultar el vínculo acudiente-estudiante');
  if (!caregiverLink) {
    const { error } = await supabase.from('acudientes_estudiante')
      .insert({ padre_usuario_id: parentId, estudiante_usuario_id: mariaId, parentesco: 'madre' });
    failIfError(error, 'No se pudo vincular el acudiente demo');
  }

  const periodRows = periods.map((period) => ({ ...period, grupo_id: group.id }));
  const { error: periodError } = await supabase.from('periodos_academicos')
    .upsert(periodRows, { onConflict: 'grupo_id,numero' });
  failIfError(periodError, 'No se pudieron guardar los períodos académicos (aplica la migración 0005)');

  const weekdays = [];
  for (const period of periods) {
    const date = new Date(`${period.fecha_inicio}T00:00:00.000Z`);
    const periodEnd = new Date(`${period.fecha_fin}T00:00:00.000Z`);
    const yesterday = new Date();
    yesterday.setUTCHours(0, 0, 0, 0);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const end = periodEnd < yesterday ? periodEnd : yesterday;
    while (date <= end) {
      if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) weekdays.push(date.toISOString().slice(0, 10));
      date.setUTCDate(date.getUTCDate() + 1);
    }
  }

  for (const date of weekdays) {
    const { data: sessionRows, error: sessionError } = await supabase.from('sesiones_asistencia')
      .upsert({
        grupo_id: group.id,
        coordinador_usuario_id: coordinatorId,
        fecha: date,
        tipo: 'entrada',
        estado: 'cerrada',
      }, { onConflict: 'grupo_id,fecha,tipo', ignoreDuplicates: true })
      .select('id');
    failIfError(sessionError, `No se pudo guardar la sesión demo (${date})`);
    let sessionId = sessionRows?.[0]?.id;
    if (!sessionId) {
      const { data, error } = await supabase.from('sesiones_asistencia')
        .select('id')
        .eq('grupo_id', group.id)
        .eq('fecha', date)
        .eq('tipo', 'entrada')
        .single();
      failIfError(error, `No se encontró la sesión demo (${date})`);
      sessionId = data.id;
    }

    const { data: existingRecords, error: recordsSearchError } = await supabase.from('registros_asistencia')
      .select('estudiante_usuario_id')
      .eq('sesion_id', sessionId);
    failIfError(recordsSearchError, `No se pudieron consultar asistencias (${date})`);
    const recordedIds = new Set((existingRecords || []).map((record) => record.estudiante_usuario_id));
    const records = studentIds.filter((id) => !recordedIds.has(id)).map((studentId) => {
      const studentIndex = studentIds.indexOf(studentId);
      const dayNumber = Number(date.slice(-2));
      const absent = (studentIndex + dayNumber) % 19 === 0;
      const late = !absent && (studentIndex * 3 + dayNumber) % 13 === 0;
      return {
        sesion_id: sessionId,
        estudiante_usuario_id: studentId,
        metodo: 'manual',
        estado: absent ? 'ausente' : late ? 'tardanza' : 'presente',
        registrado_por_usuario_id: coordinatorId,
      };
    });
    if (records.length) {
      const { error } = await supabase.from('registros_asistencia').insert(records);
      failIfError(error, `No se pudieron guardar asistencias (${date})`);
    }
  }

  const notificationContent = 'El grupo 7°B tiene nuevos registros de asistencia disponibles.';
  const { data: notification, error: notificationSearchError } = await supabase.from('notificaciones')
    .select('id')
    .eq('usuario_id', parentId)
    .eq('contenido', notificationContent)
    .maybeSingle();
  failIfError(notificationSearchError, 'No se pudo consultar la notificación demo');
  if (!notification) {
    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: parentId,
      tipo: 'asistencia_registrada',
      contenido: notificationContent,
      referencia_tipo: 'grupo',
      referencia_id: group.id,
    });
    failIfError(error, 'No se pudo guardar la notificación demo');
  }

  const demoMessageSubject = 'Bienvenida a PREZEN';
  const { data: existingMessage, error: messageSearchError } = await supabase.from('comunicaciones')
    .select('id')
    .eq('remitente_usuario_id', parentId)
    .eq('destinatario_usuario_id', directorId)
    .eq('asunto', demoMessageSubject)
    .maybeSingle();
  failIfError(messageSearchError, 'No se pudo consultar el mensaje demo');
  if (!existingMessage) {
    const { error } = await supabase.from('comunicaciones').insert({
      remitente_usuario_id: parentId,
      destinatario_usuario_id: directorId,
      estudiante_usuario_id: mariaId,
      grupo_id: group.id,
      asunto: demoMessageSubject,
      contenido: 'Hola, ya puedo consultar en PREZEN la asistencia de María Escobedo. Gracias.',
    });
    failIfError(error, 'No se pudo guardar el mensaje demo');
  }

  console.log(`Datos demo preparados: ${demoAccounts.length} cuentas, ${studentNames.length} estudiantes, ${weekdays.length} sesiones.`);
}

ensureDemoData().catch((error) => {
  console.error(`No se completó la carga demo: ${error.message}`);
  process.exitCode = 1;
});
