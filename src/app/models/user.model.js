import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { queryAll, queryOne, queryRows } from './query.model.js';

const PROFILE_FIELDS = 'id, nombre, telefono, avatar_url, estado, roles(nombre)';

export const UserModel = {
  getProfileById(id) {
    return queryOne(
      supabaseAdmin.from('usuarios').select(PROFILE_FIELDS).eq('id', id).maybeSingle(),
      'No se pudo consultar el perfil de usuario.',
    );
  },

  async updateProfile(id, changes) {
    return queryOne(
      supabaseAdmin.from('usuarios')
        .update({ ...changes, actualizado_en: new Date().toISOString() })
        .eq('id', id)
        .select('id, nombre, telefono, avatar_url, estado')
        .single(),
      'No se pudo actualizar el perfil.',
    );
  },

  async updateAvatarUrl(id, avatarUrl) {
    return queryRows(
      supabaseAdmin.from('usuarios')
        .update({ avatar_url: avatarUrl, actualizado_en: new Date().toISOString() })
        .eq('id', id)
        .select('id'),
      'No se pudo guardar la foto en el perfil.',
    );
  },

  getNamesByIds(ids) {
    if (!ids.length) return Promise.resolve([]);
    return queryAll(
      () => supabaseAdmin.from('usuarios').select('id, nombre').in('id', ids),
      'No se pudieron consultar los nombres de usuario.',
    );
  },

  getStudentsByIds(ids) {
    if (!ids.length) return Promise.resolve([]);
    return queryAll(
      () => supabaseAdmin.from('usuarios').select('id, nombre, estado').in('id', ids),
      'No se pudieron cargar los estudiantes.',
    );
  },
};
