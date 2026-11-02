import { AttendanceModel } from '../models/attendance.model.js';
import { GroupModel } from '../models/group.model.js';
import { NotificationModel } from '../models/notification.model.js';
import { SessionModel } from '../models/session.model.js';
import { AppError } from '../../lib/appError.js';

async function crearRegistro({ sesion_id, estudiante_usuario_id, metodo, estado, registrado_por_usuario_id }) {
  const registro = await AttendanceModel.insertRecord({ sesion_id, estudiante_usuario_id, metodo, estado, registrado_por_usuario_id });

  // Notificar a todos los acudientes del estudiante
  const caregivers = await GroupModel.getCaregiversForStudents(estudiante_usuario_id);

  const notifications = caregivers.map((caregiver) => ({
    usuario_id: caregiver.padre_usuario_id,
    tipo: 'asistencia_registrada',
    contenido: `Se registró asistencia (${estado}) para tu hijo/a.`,
    referencia_tipo: 'registro_asistencia',
    referencia_id: registro.id,
  }));
  if (notifications.length) {
    await NotificationModel.insertMany(notifications);
  }

  return registro;
}

async function verificarSesionAsignada(coordinadorId, sesionId, estudianteId) {
  const sesion = await AttendanceModel.getSessionById(sesionId);
  if (!sesion) throw new AppError(403, 'NO_ASIGNADO', 'No tienes acceso a esta sesión.');
  if (sesion.estado !== 'abierta') throw new AppError(409, 'SESION_CERRADA', 'La sesión de asistencia ya está cerrada.');

  const assignment = await GroupModel.getCoordinatorAssignment(sesion.grupo_id, coordinadorId);
  if (!assignment) throw new AppError(403, 'NO_ASIGNADO', 'No tienes acceso a esta sesión.');

  if (estudianteId) {
    const matricula = await AttendanceModel.getEnrollment(sesion.grupo_id, estudianteId);
    if (!matricula) throw new AppError(403, 'ESTUDIANTE_FUERA_DEL_GRUPO', 'El estudiante no pertenece al grupo de la sesión.');
  }
}

export async function registrarPorQr(coordinadorId, sesionId, codigoQr) {
  const matricula = await AttendanceModel.getQrEnrollment(codigoQr);
  if (!matricula || matricula.estado !== 'activo') {
    throw new AppError(404, 'CODIGO_QR_INVALIDO', 'El código QR no corresponde a ningún estudiante activo.');
  }

  await verificarSesionAsignada(coordinadorId, sesionId, matricula.estudiante_usuario_id);
  return crearRegistro({
    sesion_id: sesionId,
    estudiante_usuario_id: matricula.estudiante_usuario_id,
    metodo: 'qr',
    estado: 'presente',
    registrado_por_usuario_id: coordinadorId,
  });
}

export async function registrarManual(coordinadorId, sesionId, estudianteId, estado) {
  await verificarSesionAsignada(coordinadorId, sesionId, estudianteId);
  return crearRegistro({
    sesion_id: sesionId,
    estudiante_usuario_id: estudianteId,
    metodo: 'manual',
    estado,
    registrado_por_usuario_id: coordinadorId,
  });
}