import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { queryRows } from './query.model.js';

export const PeriodModel = {
  listForGroups(groupIds) {
    if (!groupIds.length) return Promise.resolve([]);
    return queryRows(
      supabaseAdmin.from('periodos_academicos')
        .select('grupo_id, numero, fecha_inicio, fecha_fin')
        .in('grupo_id', groupIds)
        .order('numero'),
      'No se pudieron cargar los períodos académicos.',
    );
  },
};
