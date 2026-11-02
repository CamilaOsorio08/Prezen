import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { registerByQr, registerManual } from '../controllers/asistencia.controller.js';

export const asistenciaRouter = Router();
asistenciaRouter.post('/qr', authMiddleware, soloRol('coordinador'), registerByQr);
asistenciaRouter.post('/manual', authMiddleware, soloRol('coordinador'), registerManual);
