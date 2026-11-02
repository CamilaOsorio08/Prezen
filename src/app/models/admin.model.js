import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';

export const AdminModel = {
  async getCounts(today) {
    const results = await Promise.all([
      supabaseAdmin.from('estudiantes_grupo').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
      supabaseAdmin.from('sesiones_asistencia').select('id', { count: 'exact', head: true }).eq('fecha', today),
      supabaseAdmin.from('grupos').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('coordinadores_grupo').select('coordinador_usuario_id', { count: 'exact', head: true }),
      supabaseAdmin.from('usuarios').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
    ]);
    if (results.some((result) => result.error)) {
      throw new AppError(503, 'ERROR_CONSULTA_BD', 'No se pudieron cargar las estadísticas administrativas.');
    }
    return results.map((result) => result.count || 0);
  },
};
