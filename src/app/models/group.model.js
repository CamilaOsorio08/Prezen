import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';
import { queryAll, queryRows } from './query.model.js';

const GROUP_FIELDS = 'id, nombre, jornada, anio_lectivo, director_usuario_id';

export const GroupModel = {
  listAll() {
    return queryAll(
      () => supabaseAdmin.from('grupos').select(GROUP_FIELDS).order('nombre'),
      'No se pudieron cargar los grupos.',
    );
  },

  getByDirector(userId) {
    return queryRows(
      supabaseAdmin.from('grupos').select(GROUP_FIELDS).eq('director_usuario_id', userId),
      'No se pudieron cargar los grupos asignados al director.',
    );
  },

  async getIdsByCoordinator(userId) {
    const rows = await queryRows(
      supabaseAdmin.from('coordinadores_grupo').select('grupo_id').eq('coordinador_usuario_id', userId),
      'No se pudieron cargar los grupos asignados al coordinador.',
    );
    return [...new Set(rows.map((row) => row.grupo_id))];
  },

  async getStudentIdsByCaregiver(userId) {
    const rows = await queryRows(
      supabaseAdmin.from('acudientes_estudiante').select('estudiante_usuario_id').eq('padre_usuario_id', userId),
      'No se pudieron cargar los estudiantes asociados al acudiente.',
    );
    return rows.map((row) => row.estudiante_usuario_id);
  },

  getByIds(ids) {
    if (!ids.length) return Promise.resolve([]);
    return queryRows(
      supabaseAdmin.from('grupos').select(GROUP_FIELDS).in('id', ids),
      'No se pudieron cargar los grupos.',
    );
  },

  getBasicByIds(ids) {
    if (!ids.length) return Promise.resolve([]);
    return queryRows(
      supabaseAdmin.from('grupos').select('id, nombre').in('id', ids),
      'No se pudieron cargar los grupos.',
    );
  },

  getAssignedByIds(userId, role, groupIds) {
    if (role === 'director_grupo') {
      return queryRows(
        supabaseAdmin.from('grupos').select('id').in('id', groupIds).eq('director_usuario_id', userId),
        'No se pudieron validar los grupos asignados.',
      );
    }
    if (role === 'coordinador') {
      return queryRows(
        supabaseAdmin.from('coordinadores_grupo').select('grupo_id').in('grupo_id', groupIds).eq('coordinador_usuario_id', userId),
        'No se pudieron validar los grupos asignados.',
      );
    }
    throw new AppError(403, 'ROL_NO_VALIDO', 'El rol no puede acceder a grupos.');
  },

  async getActiveEnrollmentsByGroups(groupIds) {
    if (!groupIds.length) return [];
    return queryAll(
      () => supabaseAdmin.from('estudiantes_grupo')
        .select('grupo_id, estudiante_usuario_id, estado')
        .in('grupo_id', groupIds)
        .eq('estado', 'activo'),
      'No se pudieron cargar las matrículas del grupo.',
    );
  },

  async getActiveEnrollmentsByStudents(studentIds) {
    if (!studentIds.length) return [];
    return queryAll(
      () => supabaseAdmin.from('estudiantes_grupo')
        .select('grupo_id, estudiante_usuario_id, estado')
        .in('estudiante_usuario_id', studentIds)
        .eq('estado', 'activo'),
      'No se pudieron cargar las matrículas de los estudiantes.',
    );
  },

  getEnrollmentsForContacts(groupIds) {
    return queryRows(
      supabaseAdmin.from('estudiantes_grupo')
        .select('grupo_id, estudiante_usuario_id')
        .in('grupo_id', groupIds)
        .eq('estado', 'activo'),
      'No se pudieron cargar las matrículas del grupo.',
    );
  },

  getActiveEnrollmentsForRecipient({ studentId, groupId }) {
    let query = supabaseAdmin.from('estudiantes_grupo')
      .select('grupo_id, estudiante_usuario_id')
      .eq('estado', 'activo');
    query = studentId
      ? query.eq('estudiante_usuario_id', studentId)
      : query.eq('grupo_id', groupId);
    return queryRows(query, 'No se pudieron consultar las matrículas del destinatario.');
  },

  getCoordinatorAssignment(groupId, userId) {
    return queryRows(
      supabaseAdmin.from('coordinadores_grupo')
        .select('id')
        .eq('grupo_id', groupId)
        .eq('coordinador_usuario_id', userId)
        .limit(1),
      'No se pudo validar la asignación del coordinador.',
    ).then((rows) => rows[0] || null);
  },

  getContactsRelations(studentIds) {
    return queryRows(
      supabaseAdmin.from('acudientes_estudiante')
        .select('estudiante_usuario_id, padre_usuario_id')
        .in('estudiante_usuario_id', studentIds),
      'No se pudieron cargar los acudientes de los estudiantes.',
    );
  },

  getCaregiversForStudents(studentId) {
    return queryRows(
      supabaseAdmin.from('acudientes_estudiante')
        .select('padre_usuario_id')
        .eq('estudiante_usuario_id', studentId),
      'No se pudieron consultar los acudientes del estudiante.',
    );
  },

};
