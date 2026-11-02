import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';
import { queryOne, queryRows } from './query.model.js';

export const SessionModel = {
  async create(input) {
    const { data, error } = await supabaseAdmin.from('sesiones_asistencia').insert(input).select().single();
    if (error?.code === '23505') {
      throw new AppError(409, 'SESION_YA_EXISTE', `Ya existe una sesión de ${input.tipo} para este grupo hoy.`);
    }
    if (error) throw new AppError(503, 'ERROR_ABRIR_SESION', 'No se pudo abrir la sesión de asistencia.');
    return data;
  },

  getCurrentEntry(groupId, date) {
    return queryOne(
      supabaseAdmin.from('sesiones_asistencia')
        .select('id, grupo_id, coordinador_usuario_id, fecha, tipo, estado')
        .eq('grupo_id', groupId)
        .eq('fecha', date)
        .eq('tipo', 'entrada')
        .maybeSingle(),
      'No se pudo consultar la sesión de hoy.',
    );
  },

  close(sessionId, closedAt) {
    return queryRows(
      supabaseAdmin.from('sesiones_asistencia')
        .update({ estado: 'cerrada', cerrada_en: closedAt })
        .eq('id', sessionId)
        .select('id'),
      'No se pudo cerrar la sesión.',
    );
  },

  async getGroupStudents(groupId) {
    return queryRows(
      supabaseAdmin.from('estudiantes_grupo')
        .select('estudiante_usuario_id')
        .eq('grupo_id', groupId)
        .eq('estado', 'activo'),
      'No se pudieron cargar los estudiantes del grupo.',
    );
  },
};
