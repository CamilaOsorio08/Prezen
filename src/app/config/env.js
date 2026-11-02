import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_ANON_KEY: z.string().min(20, 'Falta SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'Falta SUPABASE_SERVICE_ROLE_KEY'),
  PASSWORD_RESET_REDIRECT_URL: z.string().url().default('http://localhost:3000/auth/reset-password.html'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  console.error('❌ Variables de entorno inválidas o faltantes:');
  console.error(resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;