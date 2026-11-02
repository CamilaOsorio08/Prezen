import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../../lib/appError.js';
import { AdminManagementModel } from '../models/admin-management.model.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const roleSchema = z.enum(['admin', 'coordinador', 'director_grupo', 'padre_familia', 'estudiante']);
const uuidSchema = z.string().uuid();
const userCreateSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
  nombre: z.string().trim().min(1).max(100),
  rol: roleSchema,
  telefono: z.string().trim().max(30).nullable().optional(),
});
const userUpdateSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  telefono: z.string().trim().max(30).nullable().optional(),
  rol: roleSchema.optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Debes enviar al menos un dato.');
const groupSchema = z.object({
  nombre: z.string().trim().min(1).max(20),
  jornada: z.enum(['mañana', 'tarde']),
  anio_lectivo: z.string().trim().min(4).max(9),
  director_usuario_id: uuidSchema.nullable().optional(),
});
const enrollmentSchema = z.object({
  grupo_id: z.number().int().positive(),
  estudiante_usuario_id: uuidSchema,
  estado: z.enum(['activo', 'retirado']).default('activo'),
});

function createQrCode() {
  return `PZ-${randomBytes(24).toString('base64url')}`;
}

function requireRecord(record, entity) {
  if (!record) throw new AppError(404, `${entity.toUpperCase()}_NO_ENCONTRADO`, `${entity} no encontrado.`);
  return record;
}

async function requireUserRole(id, role, message) {
  const user = await AdminManagementModel.getUserRole(id);
  if (!user || user.estado !== 'activo' || user.roles?.nombre !== role) {
    throw new AppError(422, 'USUARIO_ROL_INVALIDO', message);
  }
}

export async function listUsers(req, res, next) {
  try {
    res.json({ success: true, data: await AdminManagementModel.listUsers() });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  let createdUserId;
  try {
    const input = userCreateSchema.parse(req.body);
    const role = await AdminManagementModel.getRoleId(input.rol);
    if (!role) throw new AppError(422, 'ROL_NO_ENCONTRADO', 'El rol solicitado no existe.');

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { nombre: input.nombre },
    });
    if (error) {
      if (error.code === 'email_exists' || error.code === 'user_already_exists') {
        throw new AppError(409, 'CORREO_YA_REGISTRADO', 'Ya existe una cuenta con ese correo.');
      }
      if (error.status === 422) throw new AppError(422, 'CUENTA_INVALIDA', 'Supabase rechazó los datos de la cuenta.');
      throw new AppError(503, 'ERROR_CREAR_CUENTA', 'No se pudo crear la cuenta de usuario.');
    }

    createdUserId = data.user.id;
    const profile = await AdminManagementModel.saveUser({
      id: createdUserId,
      nombre: input.nombre,
      telefono: input.telefono || null,
      rol_id: role.id,
      estado: 'activo',
    });
    res.status(201).json({ success: true, data: { ...profile, email: data.user.email } });
  } catch (error) {
    if (createdUserId) {
      try {
        const { error: rollbackError } = await AdminManagementModel.deleteAuthUser(createdUserId);
        if (rollbackError) console.error('No se pudo revertir la cuenta Auth tras fallar el perfil:', rollbackError.message);
      } catch (rollbackError) {
        console.error('No se pudo revertir la cuenta Auth tras fallar el perfil:', rollbackError.message);
      }
    }
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = uuidSchema.parse(req.params.id);
    const input = userUpdateSchema.parse(req.body);
    if (id === req.user.id && (input.rol || input.estado === 'inactivo')) {
      throw new AppError(400, 'CAMBIO_PROPIO_NO_PERMITIDO', 'No puedes cambiar tu propio rol ni desactivar tu cuenta.');
    }
    const changes = { nombre: input.nombre, telefono: input.telefono, estado: input.estado };
    if (input.rol) {
      const role = await AdminManagementModel.getRoleId(input.rol);
      if (!role) throw new AppError(422, 'ROL_NO_ENCONTRADO', 'El rol solicitado no existe.');
      changes.rol_id = role.id;
    }
    for (const key of Object.keys(changes)) {
      if (changes[key] === undefined) delete changes[key];
    }
    const profile = requireRecord(await AdminManagementModel.updateUser(id, changes), 'usuario');
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function listGroups(req, res, next) {
  try {
    res.json({ success: true, data: await AdminManagementModel.listGroups() });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(req, res, next) {
  try {
    const input = groupSchema.parse(req.body);
    if (input.director_usuario_id) {
      await requireUserRole(input.director_usuario_id, 'director_grupo', 'El usuario seleccionado no es un director activo.');
    }
    const group = await AdminManagementModel.createGroup(input);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const input = groupSchema.partial().refine((value) => Object.keys(value).length > 0, 'Debes enviar al menos un dato.');
    const changes = input.parse(req.body);
    if (changes.director_usuario_id) {
      await requireUserRole(changes.director_usuario_id, 'director_grupo', 'El usuario seleccionado no es un director activo.');
    }
    const group = requireRecord(await AdminManagementModel.updateGroup(id, changes), 'grupo');
    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
}

export async function listEnrollments(req, res, next) {
  try {
    const groupId = req.query.grupo_id == null ? null : z.coerce.number().int().positive().parse(req.query.grupo_id);
    res.json({ success: true, data: await AdminManagementModel.listEnrollments(groupId) });
  } catch (error) {
    next(error);
  }
}

export async function createEnrollment(req, res, next) {
  try {
    const input = enrollmentSchema.parse(req.body);
    await requireUserRole(input.estudiante_usuario_id, 'estudiante', 'El usuario seleccionado no es un estudiante activo.');
    const enrollment = await AdminManagementModel.createEnrollment({ ...input, codigo_qr: createQrCode() });
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
}

export async function updateEnrollment(req, res, next) {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const input = z.object({ estado: z.enum(['activo', 'retirado']) }).parse(req.body);
    const enrollment = requireRecord(await AdminManagementModel.updateEnrollment(id, input), 'matrícula');
    res.json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
}

export async function rotateEnrollmentQr(req, res, next) {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const enrollment = requireRecord(
      await AdminManagementModel.rotateEnrollmentQr(id, createQrCode()),
      'matrícula',
    );
    res.json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
}

export async function listCoordinators(req, res, next) {
  try {
    const groupId = z.coerce.number().int().positive().parse(req.params.id);
    res.json({ success: true, data: await AdminManagementModel.listCoordinators(groupId) });
  } catch (error) {
    next(error);
  }
}

export async function assignCoordinator(req, res, next) {
  try {
    const groupId = z.coerce.number().int().positive().parse(req.params.id);
    const coordinatorId = uuidSchema.parse(z.object({ coordinador_usuario_id: uuidSchema }).parse(req.body).coordinador_usuario_id);
    await requireUserRole(coordinatorId, 'coordinador', 'El usuario seleccionado no es un coordinador activo.');
    res.status(201).json({
      success: true,
      data: await AdminManagementModel.assignCoordinator(groupId, coordinatorId),
    });
  } catch (error) {
    next(error);
  }
}

export async function removeCoordinator(req, res, next) {
  try {
    const groupId = z.coerce.number().int().positive().parse(req.params.id);
    const coordinatorId = uuidSchema.parse(req.params.coordinatorId);
    const removed = await AdminManagementModel.removeCoordinator(groupId, coordinatorId);
    if (!removed.length) throw new AppError(404, 'ASIGNACION_NO_ENCONTRADA', 'La asignación no existe.');
    res.json({ success: true, data: { eliminada: true } });
  } catch (error) {
    next(error);
  }
}
