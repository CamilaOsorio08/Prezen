import request from 'supertest';
import { app } from '../../app/app.js';

test('POST /api/v1/sesiones sin token responde 401', async () => {
  const respuesta = await request(app).post('/api/v1/sesiones').send({ grupo_id: 1, tipo: 'entrada' });

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.success).toBe(false);
  expect(respuesta.body.error.code).toBe('NO_AUTENTICADO');
});