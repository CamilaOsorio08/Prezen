import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { queryAll, queryRows } from './query.model.js';

export const CommunicationModel = {
  listForUser(userId) {
    return queryRows(
      supabaseAdmin.from('comunicaciones')
        .select('id, remitente_usuario_id, destinatario_usuario_id, estudiante_usuario_id, grupo_id, asunto, contenido, creado_en, leido_en')
        .or(`remitente_usuario_id.eq.${userId},destinatario_usuario_id.eq.${userId}`)
        .order('creado_en', { ascending: false })
        .limit(100),
      'No se pudieron cargar las comunicaciones.',
    );
  },

  insertMany(messages) {
    return queryRows(
      supabaseAdmin.from('comunicaciones').insert(messages).select(),
      'No se pudieron guardar las comunicaciones.',
    );
  },
};
