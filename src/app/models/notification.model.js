import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { queryAll, queryRows } from './query.model.js';

export const NotificationModel = {
  listForUser(userId) {
    return queryAll(
      () => supabaseAdmin.from('notificaciones')
        .select('id, tipo, contenido, leida, creado_en')
        .eq('usuario_id', userId)
        .order('creado_en', { ascending: false }),
      'No se pudieron cargar las notificaciones.',
    );
  },

  markAllReadForUser(userId) {
    return queryRows(
      supabaseAdmin.from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', userId)
        .eq('leida', false)
        .select('id'),
      'No se pudieron actualizar las notificaciones.',
    );
  },

  insertMany(notifications) {
    return queryRows(
      supabaseAdmin.from('notificaciones').insert(notifications).select('id'),
      'No se pudieron crear las notificaciones.',
    );
  },
};
