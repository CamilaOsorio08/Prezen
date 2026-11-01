import { AppError } from '../src/lib/AppError.js';

export function soloRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new AppError(403, 'NO_AUTORIZADO', 'No tienes permiso para esta acción.'));
    }
    next();
  };
}