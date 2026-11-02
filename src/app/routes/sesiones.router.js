import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { closeSession, getCurrentSession, openSession } from '../controllers/sesiones.controller.js';

export const sesionesRouter = Router();
sesionesRouter.post('/', authMiddleware, soloRol('coordinador'), openSession);
sesionesRouter.patch('/:id/cerrar', authMiddleware, soloRol('coordinador', 'admin'), closeSession);
sesionesRouter.get('/actual', authMiddleware, soloRol('coordinador', 'admin'), getCurrentSession);
