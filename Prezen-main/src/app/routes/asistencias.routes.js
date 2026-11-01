import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { registrarPorQr, registrarManual } from '../services/asistencia.service.js';

export const asistenciaRouter = Router();

asistenciaRouter.post('/qr', authMiddleware, soloRol('coordinador'), async (req, res, next) => {
  try {
    const schema = z.object({ sesion_id: z.number().int().positive(), codigo_qr: z.string().min(1) });
    const { sesion_id, codigo_qr } = schema.parse(req.body);
    const registro = await registrarPorQr(req.user.id, sesion_id, codigo_qr);
    res.status(201).json({ success: true, data: registro });
  } catch (err) {
    next(err);
  }
});

asistenciaRouter.post('/manual', authMiddleware, soloRol('coordinador'), async (req, res, next) => {
  try {
    const schema = z.object({
      sesion_id: z.number().int().positive(),
      estudiante_usuario_id: z.string().uuid(),
      estado: z.enum(['presente', 'tardanza', 'ausente']),
    });
    const { sesion_id, estudiante_usuario_id, estado } = schema.parse(req.body);
    const registro = await registrarManual(req.user.id, sesion_id, estudiante_usuario_id, estado);
    res.status(201).json({ success: true, data: registro });
  } catch (err) {
    next(err);
  }
});