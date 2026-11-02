import { z } from 'zod';
import { registrarPorQr, registrarManual } from '../services/asistencia.service.js';

export async function registerByQr(req, res, next) {
  try {
    const { sesion_id, codigo_qr } = z.object({
      sesion_id: z.number().int().positive(),
      codigo_qr: z.string().min(1),
    }).parse(req.body);
    const attendance = await registrarPorQr(req.user.id, sesion_id, codigo_qr);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
}

export async function registerManual(req, res, next) {
  try {
    const { sesion_id, estudiante_usuario_id, estado } = z.object({
      sesion_id: z.number().int().positive(),
      estudiante_usuario_id: z.string().uuid(),
      estado: z.enum(['presente', 'tardanza', 'ausente']),
    }).parse(req.body);
    const attendance = await registrarManual(req.user.id, sesion_id, estudiante_usuario_id, estado);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
}
