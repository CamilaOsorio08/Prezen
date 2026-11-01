import { AttendanceModel } from '../models/attendance.model.js';
import { GroupModel } from '../models/group.model.js';
import { SessionModel } from '../models/session.model.js';
import { AppError } from '../../lib/appError.js';

export async function abrirSesion(coordinadorId, { grupo_id, tipo }) {
  const asignado = await GroupModel.getCoordinatorAssignment(grupo_id, coordinadorId);
  if (!asignado) {
    throw new AppError(403, 'NO_ASIGNADO', 'No estás asignado como coordinador de este grupo.');
  }

  return SessionModel.create({ grupo_id, coordinador_usuario_id: coordinadorId, tipo });
}

export async function cerrarSesion(sesionId, usuarioId, rol) {
  const sesion = await AttendanceModel.getSessionById(sesionId);
  if (!sesion) throw new AppError(404, 'SESION_NO_ENCONTRADA', 'La sesión no existe.');

  if (rol !== 'admin') {
    const asignado = await GroupModel.getCoordinatorAssignment(sesion.grupo_id, usuarioId);
    if (!asignado) throw new AppError(403, 'NO_ASIGNADO', 'No tienes acceso a esta sesión.');
  }

  const [students, registered] = await Promise.all([
    SessionModel.getGroupStudents(sesion.grupo_id),
    AttendanceModel.getSessionRecords(sesionId),
  ]);
  const registeredIds = new Set(registered.map((record) => record.estudiante_usuario_id));
  const absentRecords = students
    .filter((student) => !registeredIds.has(student.estudiante_usuario_id))
    .map((student) => ({
      sesion_id: sesionId,
      estudiante_usuario_id: student.estudiante_usuario_id,
      metodo: 'manual',
      estado: 'ausente',
      registrado_por_usuario_id: sesion.coordinador_usuario_id,
    }));

  if (absentRecords.length) {
    await AttendanceModel.insertRecords(absentRecords);
  }

  await SessionModel.close(sesionId, new Date().toISOString());
}

export async function obtenerSesionActual(grupoId, usuarioId, rol) {
  if (rol !== 'admin') {
    const assignment = await GroupModel.getCoordinatorAssignment(grupoId, usuarioId);
    if (!assignment) throw new AppError(403, 'NO_ASIGNADO', 'No tienes acceso a este grupo.');
  }

  return SessionModel.getCurrentEntry(grupoId, new Date().toISOString().slice(0, 10));
}