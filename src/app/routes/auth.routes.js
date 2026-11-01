import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getCurrentProfile,
  login,
  refresh,
  updateAvatar,
  updateProfile,
} from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.get('/me', authMiddleware, getCurrentProfile);
authRouter.patch('/me', authMiddleware, updateProfile);
authRouter.post('/me/avatar', authMiddleware, updateAvatar);
