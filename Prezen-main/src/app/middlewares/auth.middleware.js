import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../src/lib/AppError.js';

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError(401, 'NO_AUTENTICADO', 'Falta el token de autenticación.'));

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return next(new AppError(401, 'NO_AUTENTICADO', 'Sesión inválida o expirada.'));

  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('id, rol_id, roles(nombre)')
    .eq('id', data.user.id)
    .single();

  req.user = { id: data.user.id, rol: usuario?.roles?.nombre };
  next();
}