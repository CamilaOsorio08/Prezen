import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';
import { queryAll, queryOne, queryRows } from './query.model.js';

const USER_FIELDS = 'id, nombre, telefono, avatar_url, estado, rol_id, roles(nombre)';
const GROUP_FIELDS = 'id, nombre, jornada, anio_lectivo, director_usuario_id, creado_en';

export const AdminManagementModel = {
  async listUsers() {
    const profiles = await queryAll(
      () => supabaseAdmin.from('usuarios').select(USER_FIELDS).order('nombre'),
      'No se pudieron cargar los usuarios.',
    );
    const authUsers = new Map();
    for (let page = 1; ; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new AppError(503, 'ERROR_CARGAR_USUARIOS', 'No se pudieron cargar los correos de usuario.');
      for (const user of data.users) authUsers.set(user.id, user.email);
      if (data.users.length < 1000) break;
    }
    return profiles.map((profile) => ({ ...profile, email: authUsers.get(profile.id) || '' }));
  },

  getRoleId(role) {
    return queryOne(
      supabaseAdmin.from('roles').select('id').eq('nombre', role).maybeSingle(),
      'No se pudo validar el rol.',
    );
  },

  getUserRole(id) {
    return queryOne(
      supabaseAdmin.from('usuarios').select('id, estado, roles(nombre)').eq('id', id).maybeSingle(),
      'No se pudo validar el usuario.',
    );
  },

  async saveUser(user) {
    const { data, error } = await supabaseAdmin.from('usuarios')
      .upsert(user, { onConflict: 'id' })
      .select(USER_FIELDS)
      .single();
    if (error) throw new AppError(503, 'ERROR_GUARDAR_USUARIO', 'No se pudo guardar el perfil del usuario.');
    return data;
  },

  updateUser(id, changes) {
    return queryOne(
      supabaseAdmin.from('usuarios')
        .update({ ...changes, actualizado_en: new Date().toISOString() })
        .eq('id', id)
        .select(USER_FIELDS)
        .maybeSingle(),
      'No se pudo actualizar el usuario.',
    );
  },

  deleteAuthUser(id) {
    return supabaseAdmin.auth.admin.deleteUser(id);
  },

  listGroups() {
    return queryAll(
      () => supabaseAdmin.from('grupos').select(GROUP_FIELDS).order('nombre'),
      'No se pudieron cargar los grupos.',
    );
  },

  async createGroup(group) {
    const { data, error } = await supabaseAdmin.from('grupos').insert(group).select(GROUP_FIELDS).single();
    if (error?.code === '23503') throw new AppError(422, 'DIRECTOR_INVALIDO', 'El director seleccionado no existe.');
    if (error) throw new AppError(503, 'ERROR_GUARDAR_GRUPO', 'No se pudo crear el grupo.');
    return data;
  },

  async updateGroup(id, changes) {
    const { data, error } = await supabaseAdmin.from('grupos')
      .update(changes)
      .eq('id', id)
      .select(GROUP_FIELDS)
      .maybeSingle();
    if (error?.code === '23503') throw new AppError(422, 'DIRECTOR_INVALIDO', 'El director seleccionado no existe.');
    if (error) throw new AppError(503, 'ERROR_ACTUALIZAR_GRUPO', 'No se pudo actualizar el grupo.');
    return data;
  },

  listEnrollments(groupId) {
    return queryAll(
      () => {
        let query = supabaseAdmin.from('estudiantes_grupo')
          .select('id, grupo_id, estudiante_usuario_id, codigo_qr, estado, creado_en');
        if (groupId) query = query.eq('grupo_id', groupId);
        return query.order('grupo_id');
      },
      'No se pudieron cargar las matrículas.',
    );
  },

  async createEnrollment(enrollment) {
    const { data, error } = await supabaseAdmin.from('estudiantes_grupo')
      .insert(enrollment)
      .select('id, grupo_id, estudiante_usuario_id, codigo_qr, estado, creado_en')
      .single();
    if (error?.code === '23505') throw new AppError(409, 'MATRICULA_DUPLICADA', 'El estudiante ya está matriculado en ese grupo o el QR ya existe.');
    if (error?.code === '23503') throw new AppError(422, 'MATRICULA_INVALIDA', 'El grupo o el estudiante no existe.');
    if (error) throw new AppError(503, 'ERROR_CREAR_MATRICULA', 'No se pudo crear la matrícula.');
    return data;
  },

  async updateEnrollment(id, changes) {
    const { data, error } = await supabaseAdmin.from('estudiantes_grupo')
      .update(changes)
      .eq('id', id)
      .select('id, grupo_id, estudiante_usuario_id, codigo_qr, estado, creado_en')
      .maybeSingle();
    if (error) throw new AppError(503, 'ERROR_ACTUALIZAR_MATRICULA', 'No se pudo actualizar la matrícula.');
    return data;
  },

  rotateEnrollmentQr(id, code) {
    return this.updateEnrollment(id, { codigo_qr: code });
  },

  listCoordinators(groupId) {
    return queryAll(
      () => supabaseAdmin.from('coordinadores_grupo')
        .select('id, grupo_id, coordinador_usuario_id')
        .eq('grupo_id', groupId)
        .order('id'),
      'No se pudieron cargar las asignaciones del grupo.',
    );
  },

  async assignCoordinator(groupId, userId) {
    const { data, error } = await supabaseAdmin.from('coordinadores_grupo')
      .insert({ grupo_id: groupId, coordinador_usuario_id: userId })
      .select('id, grupo_id, coordinador_usuario_id')
      .single();
    if (error?.code === '23505') throw new AppError(409, 'ASIGNACION_DUPLICADA', 'El coordinador ya está asignado a este grupo.');
    if (error?.code === '23503') throw new AppError(422, 'ASIGNACION_INVALIDA', 'El grupo o el usuario no existe.');
    if (error) throw new AppError(503, 'ERROR_ASIGNAR_COORDINADOR', 'No se pudo asignar el coordinador.');
    return data;
  },

  async removeCoordinator(groupId, userId) {
    const { data, error } = await supabaseAdmin.from('coordinadores_grupo')
      .delete()
      .eq('grupo_id', groupId)
      .eq('coordinador_usuario_id', userId)
      .select('id');
    if (error) throw new AppError(503, 'ERROR_QUITAR_ASIGNACION', 'No se pudo quitar la asignación.');
    return data || [];
  },
};
