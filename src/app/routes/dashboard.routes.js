import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { getDashboard, getReports } from '../controllers/dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', authMiddleware, getDashboard);
dashboardRouter.get('/reports', authMiddleware, soloRol('admin', 'director_grupo'), getReports);
