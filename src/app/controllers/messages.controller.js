import { z } from 'zod';
import { CommunicationModel } from '../models/communication.model.js';
import { GroupModel } from '../models/group.model.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../../lib/appError.js';

export async function listMessages(req, res, next) {
  try {
    const messages = await CommunicationModel.listForUser(req.user.id);
    const relatedIds = [...new Set(messages.flatMap((message) => [
      message.remitente_usuario_id,
      message.destinatario_usuario_id,
      message.estudiante_usuario_id,
    ].filter(Boolean)))];
    const users = await UserModel.getNamesByIds(relatedIds);
    const nameById = new Map(users.map((user) => [user.id, user.nombre]));
    res.json({
      success: true,
      data: messages.map((message) => ({
        ...message,
        remitente: nameById.get(message.remitente_usuario_id) || '',
        destinatario: nameById.get(message.destinatario_usuario_id) || '',
        estudiante: nameById.get(message.estudiante_usuario_id) || '',
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function listContacts(req, res, next) {
  try {
    let groupIds;
    if (req.user.rol === 'admin') {
      groupIds = (await GroupModel.listAll()).map((group) => group.id);
    } else if (req.user.rol === 'director_grupo') {
      groupIds = (await GroupModel.getByDirector(req.user.id)).map((group) => group.id);
    } else {
      groupIds = await GroupModel.getIdsByCoordinator(req.user.id);
    }

    if (!groupIds.length) return res.json({ success: true, data: [] });
    const enrollments = await GroupModel.getEnrollmentsForContacts(groupIds);
    const studentIds = [...new Set(enrollments.map((enrollment) => enrollment.estudiante_usuario_id))];
    if (!studentIds.length) return res.json({ success: true, data: [] });
    const [students, relations, groups] = await Promise.all([
      UserModel.getNamesByIds(studentIds),
      GroupModel.getContactsRelations(studentIds),
      GroupModel.getBasicByIds(groupIds),
    ]);
    const parentIds = [...new Set(relations.map((relation) => relation.padre_usuario_id))];
    const parents = await UserModel.getNamesByIds(parentIds);
    const studentById = new Map(students.map((student) => [student.id, student]));
    const groupById = new Map(groups.map((group) => [group.id, group]));
    const parentById = new Map(parents.map((parent) => [parent.id, parent]));
    const relationByStudent = new Map();
    for (const relation of relations) {
      const parentsForStudent = relationByStudent.get(relation.estudiante_usuario_id) || [];
      const parent = parentById.get(relation.padre_usuario_id);
      if (parent) parentsForStudent.push({ id: parent.id, nombre: parent.nombre });
      relationByStudent.set(relation.estudiante_usuario_id, parentsForStudent);
    }
    res.json({
      success: true,
      data: enrollments.map((enrollment) => ({
        estudiante_id: enrollment.estudiante_usuario_id,
        estudiante: studentById.get(enrollment.estudiante_usuario_id)?.nombre || '',
        grupo_id: enrollment.grupo_id,
        grupo: groupById.get(enrollment.grupo_id)?.nombre || '',
        acudientes: relationByStudent.get(enrollment.estudiante_usuario_id) || [],
      })),
    });
  } catch (error) {
    next(error);
  }
}

const sendMessageSchema = z.object({
  estudiante_id: z.string().uuid().optional(),
  grupo_id: z.coerce.number().int().positive().optional(),
  asunto: z.string().trim().min(1).max(160),
  contenido: z.string().trim().min(1).max(10000),
}).refine((message) => Boolean(message.estudiante_id) !== Boolean(message.grupo_id), 'Indica un estudiante o un grupo, pero no ambos.');

export async function sendMessage(req, res, next) {
  try {
    const message = sendMessageSchema.parse(req.body);
    const enrollments = await GroupModel.getActiveEnrollmentsForRecipient({
      studentId: message.estudiante_id,
      groupId: message.grupo_id,
    });
    if (!enrollments.length) throw new AppError(404, 'ESTUDIANTE_NO_ENCONTRADO', 'No se encontraron matrículas activas para el destinatario.');
    const groupIds = [...new Set(enrollments.map((enrollment) => enrollment.grupo_id))];
    if (req.user.rol !== 'admin') {
      const assignments = await GroupModel.getAssignedByIds(req.user.id, req.user.rol, groupIds);
      const assignedIds = new Set(assignments.map((assignment) => assignment.id || assignment.grupo_id));
      if (groupIds.some((groupId) => !assignedIds.has(groupId))) {
        throw new AppError(403, 'NO_AUTORIZADO', 'No tienes acceso a todos los estudiantes seleccionados.');
      }
    }
    const studentIds = [...new Set(enrollments.map((enrollment) => enrollment.estudiante_usuario_id))];
    const caregivers = await GroupModel.getContactsRelations(studentIds);
    const recipientIds = [...new Set(caregivers.map((caregiver) => caregiver.padre_usuario_id))];
    if (!recipientIds.length) throw new AppError(422, 'SIN_ACUDIENTES', 'El estudiante no tiene acudientes registrados.');

    const caregiverByStudent = new Map();
    for (const caregiver of caregivers) {
      const studentsForCaregiver = caregiverByStudent.get(caregiver.padre_usuario_id) || [];
      studentsForCaregiver.push(caregiver.estudiante_usuario_id);
      caregiverByStudent.set(caregiver.padre_usuario_id, studentsForCaregiver);
    }
    const rows = recipientIds.flatMap((recipientId) => (caregiverByStudent.get(recipientId) || []).map((studentId) => ({
      remitente_usuario_id: req.user.id,
      destinatario_usuario_id: recipientId,
      estudiante_usuario_id: studentId,
      grupo_id: enrollments.find((enrollment) => enrollment.estudiante_usuario_id === studentId)?.grupo_id,
      asunto: message.asunto,
      contenido: message.contenido,
    })));
    const data = await CommunicationModel.insertMany(rows);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
