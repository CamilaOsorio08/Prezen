import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { markNotificationsRead } from '../controllers/notifications.controller.js';

export const notificationsRouter = Router();
notificationsRouter.patch('/read', authMiddleware, markNotificationsRead);
