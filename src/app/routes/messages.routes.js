import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import { listContacts, listMessages, sendMessage } from '../controllers/messages.controller.js';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);
messagesRouter.get('/messages', listMessages);
messagesRouter.get('/contacts', soloRol('director_grupo', 'coordinador', 'admin'), listContacts);
messagesRouter.post('/messages', soloRol('director_grupo', 'coordinador', 'admin'), sendMessage);
