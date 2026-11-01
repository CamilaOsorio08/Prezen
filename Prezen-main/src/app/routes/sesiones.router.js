import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { abrirSesion, cerrarSesion } from '../services/sesiones.service.js';

export const sesionesRouter = Router();

const abrirSesionSchema = z.object({
  grupo_id: z.number().int().positive(),
  tipo: z.enum(['entrada', 'salida']),
});

sesionesRouter.post('/', authMiddleware, soloRol('coordinador'), async (req, res, next) => {
  try {
    const datos = abrirSesionSchema.parse(req.body);
    const sesion = await abrirSesion(req.user.id, datos);
    res.status(201).json({ success: true, data: sesion });
  } catch (err) {
    next(err);
  }
});

sesionesRouter.patch('/:id/cerrar', authMiddleware, soloRol('coordinador', 'admin'), async (req, res, next) => {
  try {
    await cerrarSesion(Number(req.params.id));
    res.json({ success: true, data: { mensaje: 'Sesión cerrada; los ausentes quedaron registrados.' } });
  } catch (err) {
    next(err);
  }
});