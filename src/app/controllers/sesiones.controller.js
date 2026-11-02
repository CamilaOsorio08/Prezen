import { z } from 'zod';
import { abrirSesion, cerrarSesion, obtenerSesionActual } from '../services/sesiones.service.js';
import { AppError } from '../../lib/appError.js';

export async function openSession(req, res, next) {
  try {
    const sessionInput = z.object({
      grupo_id: z.number().int().positive(),
      tipo: z.enum(['entrada', 'salida']),
    }).parse(req.body);
    const session = await abrirSesion(req.user.id, sessionInput);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

export async function closeSession(req, res, next) {
  try {
    const sessionId = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!sessionId.success) throw new AppError(400, 'SESION_INVALIDA', 'El identificador de sesión no es válido.');
    await cerrarSesion(sessionId.data, req.user.id, req.user.rol);
    res.json({ success: true, data: { mensaje: 'Sesión cerrada; los ausentes quedaron registrados.' } });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentSession(req, res, next) {
  try {
    const { grupo_id: groupId } = z.object({
      grupo_id: z.coerce.number().int().positive(),
    }).parse(req.query);
    const session = await obtenerSesionActual(groupId, req.user.id, req.user.rol);
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}
