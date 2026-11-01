import { AuthModel } from '../models/auth.model.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../../lib/appError.js';

export async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) throw new AppError(401, 'NO_AUTENTICADO', 'Falta el token de autenticación.');

    const { data, error } = await AuthModel.getUserFromAccessToken(token);
    if (error || !data.user) throw new AppError(401, 'NO_AUTENTICADO', 'Sesión inválida o expirada.');

    const usuario = await UserModel.getProfileById(data.user.id);
    if (!usuario || usuario.estado !== 'activo' || !usuario.roles?.nombre) {
      throw new AppError(403, 'PERFIL_NO_DISPONIBLE', 'El perfil no existe o está inactivo.');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      avatar_url: usuario.avatar_url,
      rol: usuario.roles.nombre,
    };
    next();
  } catch (error) {
    next(error);
  }
}