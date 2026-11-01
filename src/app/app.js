import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { sesionesRouter } from './routes/sesiones.router.js';
import { asistenciaRouter } from './routes/asistencias.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { messagesRouter } from './routes/messages.routes.js';
import { getDatabaseHealth, getHealth } from './controllers/health.controller.js';
import { notificationsRouter } from './routes/notifications.routes.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const app = express();
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      styleSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(projectRoot, 'public')));

app.get('/', (req, res) => res.redirect('/auth/index.html'));

app.get('/api/v1/health', getHealth);
app.get('/api/v1/health/db', getDatabaseHealth);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', dashboardRouter);
app.use('/api/v1/sesiones', sesionesRouter);
app.use('/api/v1/asistencia', asistenciaRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1', messagesRouter);
app.use(errorMiddleware);
