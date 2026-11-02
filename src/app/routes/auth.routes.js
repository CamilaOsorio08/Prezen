import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getCurrentProfile,
  changePassword,
  login,
  refresh,
  requestPasswordReset,
  resetPassword,
  updateAvatar,
  updateProfile,
} from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/password/forgot', requestPasswordReset);
authRouter.post('/password/reset', resetPassword);
authRouter.get('/me', authMiddleware, getCurrentProfile);
authRouter.patch('/me', authMiddleware, updateProfile);
authRouter.patch('/me/password', authMiddleware, changePassword);
authRouter.post('/me/avatar', authMiddleware, updateAvatar);
