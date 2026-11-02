import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';
import { queryAll, queryOne, queryRows } from './query.model.js';

export const AttendanceModel = {
  getSessionsByGroupsSince(groupIds, since) {
    if (!groupIds.length) return Promise.resolve([]);
    return queryAll(
      () => supabaseAdmin.from('sesiones_asistencia')
        .select('id, grupo_id, fecha, tipo, estado')
        .in('grupo_id', groupIds)
        .gte('fecha', since)
        .order('fecha', { ascending: false }),
      'No se pudieron cargar las sesiones de asistencia.',
    );
  },

  getSessionsByGroupsBetween(groupIds, startDate, endDate) {
    if (!groupIds.length || startDate > endDate) return Promise.resolve([]);
    return queryAll(
      () => supabaseAdmin.from('sesiones_asistencia')
        .select('id, grupo_id, fecha, tipo')
        .in('grupo_id', groupIds)
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .eq('tipo', 'entrada')
        .order('fecha'),
      'No se pudieron cargar las sesiones del reporte.',
    );
  },

  getRecordsBySessionsAndStudents(sessionIds, studentIds) {
    if (!sessionIds.length || !studentIds.length) return Promise.resolve([]);
    return queryAll(
      () => supabaseAdmin.from('registros_asistencia')
        .select('sesion_id, estudiante_usuario_id, estado, hora_registro')
        .in('sesion_id', sessionIds)
        .in('estudiante_usuario_id', studentIds),
      'No se pudieron cargar los registros de asistencia.',
    );
  },

  getRecordsBySessions(sessionIds) {
    if (!sessionIds.length) return Promise.resolve([]);
    return queryAll(
      () => supabaseAdmin.from('registros_asistencia')
        .select('sesion_id, estudiante_usuario_id, estado')
        .in('sesion_id', sessionIds),
      'No se pudieron cargar los registros del reporte.',
    );
  },

  getSessionById(sessionId) {
    return queryOne(
      supabaseAdmin.from('sesiones_asistencia')
        .select('id, grupo_id, coordinador_usuario_id, fecha, tipo, estado')
        .eq('id', sessionId)
        .maybeSingle(),
      'No se pudo consultar la sesión de asistencia.',
    );
  },

  getQrEnrollment(qrCode) {
    return queryOne(
      supabaseAdmin.from('estudiantes_grupo')
        .select('estudiante_usuario_id, estado')
        .eq('codigo_qr', qrCode)
        .maybeSingle(),
      'No se pudo consultar el código QR.',
    );
  },

  getEnrollment(groupId, studentId) {
    return queryOne(
      supabaseAdmin.from('estudiantes_grupo')
        .select('id')
        .eq('grupo_id', groupId)
        .eq('estudiante_usuario_id', studentId)
        .eq('estado', 'activo')
        .maybeSingle(),
      'No se pudo validar la matrícula del estudiante.',
    );
  },

  getSessionRecords(sessionId) {
    return queryRows(
      supabaseAdmin.from('registros_asistencia')
        .select('estudiante_usuario_id')
        .eq('sesion_id', sessionId),
      'No se pudieron consultar los registros de la sesión.',
    );
  },

  async insertRecord(record) {
    const { data, error } = await supabaseAdmin.from('registros_asistencia').insert(record).select().single();
    if (error?.code === '23505') {
      throw new AppError(409, 'ASISTENCIA_DUPLICADA', 'Este estudiante ya tiene asistencia registrada en esta sesión.');
    }
    if (error) throw new AppError(503, 'ERROR_REGISTRAR_ASISTENCIA', 'No se pudo guardar el registro de asistencia.');
    return data;
  },

  insertRecords(records) {
    return queryRows(
      supabaseAdmin.from('registros_asistencia').insert(records).select(),
      'No se pudieron guardar los registros de asistencia.',
    );
  },
};
