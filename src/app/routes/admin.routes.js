import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { getAdminStats } from '../controllers/admin.controller.js';

export const adminRouter = Router();
adminRouter.get('/stats', authMiddleware, soloRol('admin'), getAdminStats);
