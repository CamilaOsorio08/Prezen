import { supabaseAdmin } from './config/supabaseAdmin.js';
import { AppError } from '../lib/appError.js';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { sesionesRouter } from './routes/sesiones.routes.js';
import { asistenciaRouter } from './routes/asistencia.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { env } from './config/env.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.static(path.resolve('public')));

app.use('/api/v1/sesiones', sesionesRouter);
app.use('/api/v1/asistencia', asistenciaRouter);
app.use('/api/v1/admin', adminRouter);
app.get('/api/v1/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use(errorMiddleware); 

app.get('/api/v1/health/db', async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('roles')
      .select('*', { count: 'exact', head: true });
    if (error) throw new AppError(503, 'BD_NO_DISPONIBLE', 'No se pudo conectar con Supabase.');
    res.json({ success: true, data: { status: 'ok', db: 'supabase' } });
  } catch (err) {
    next(err);
  }
});
