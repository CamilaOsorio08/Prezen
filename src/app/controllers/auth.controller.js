import { z } from 'zod';
import { AuthModel } from '../models/auth.model.js';
import { ProfileAvatarModel } from '../models/profile-avatar.model.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../../lib/appError.js';
import { env } from '../config/env.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  telefono: z.string().trim().max(30).nullable().optional(),
  avatar_url: z.string().url().max(2048).nullable().optional(),
}).refine((profile) => Object.keys(profile).length > 0, 'Debes enviar al menos un dato de perfil.');

export async function login(req, res, next) {
  try {
    const credentials = loginSchema.parse(req.body);
    const { data, error } = await AuthModel.signIn(credentials);
    if (error || !data.session || !data.user) {
      throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
    }
    const profile = await UserModel.getProfileById(data.user.id);
    if (!profile || profile.estado !== 'activo') {
      throw new AppError(403, 'PERFIL_NO_DISPONIBLE', 'El perfil no existe o está inactivo.');
    }
    if (!profile.roles?.nombre) {
      throw new AppError(403, 'ROL_NO_ASIGNADO', 'El perfil no tiene un rol asignado.');
    }
    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        profile: { ...profile, email: data.user.email, rol: profile.roles.nombre },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = z.object({ refresh_token: z.string().min(1) }).parse(req.body).refresh_token;
    const { data, error } = await AuthModel.refresh(refreshToken);
    if (error || !data.session) throw new AppError(401, 'SESION_EXPIRADA', 'La sesión expiró. Inicia sesión de nuevo.');
    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const email = z.object({ email: z.string().email() }).parse(req.body).email;
    const { error } = await AuthModel.requestPasswordReset(email, env.PASSWORD_RESET_REDIRECT_URL);
    if (error) throw new AppError(503, 'ERROR_RECUPERAR_CONTRASENA', 'No se pudieron enviar las instrucciones. Intenta de nuevo más tarde.');
    res.json({
      success: true,
      data: { mensaje: 'Si el correo está registrado, recibirás instrucciones para restablecer la contraseña.' },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const input = z.object({
      token_hash: z.string().min(1).max(2048),
      password: z.string().min(8).max(128),
    }).parse(req.body);
    const { error, stage } = await AuthModel.resetPasswordWithRecoveryToken(input.token_hash, input.password);
    if (error && stage === 'password') {
      throw new AppError(422, 'CONTRASENA_RECHAZADA', 'La nueva contraseña no cumple las políticas configuradas en Supabase.');
    }
    if (error) throw new AppError(400, 'ENLACE_RECUPERACION_INVALIDO', 'El enlace de recuperación es inválido o expiró. Solicita uno nuevo.');
    res.json({ success: true, data: { mensaje: 'La contraseña se actualizó correctamente.' } });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { current_password: currentPassword, password } = z.object({
      current_password: z.string().min(1),
      password: z.string().min(8).max(128),
    }).parse(req.body);
    const { data, error } = await AuthModel.signIn({ email: req.user.email, password: currentPassword });
    if (error || data.user?.id !== req.user.id) {
      throw new AppError(401, 'CONTRASENA_ACTUAL_INVALIDA', 'La contraseña actual es incorrecta.');
    }
    const { error: updateError } = await AuthModel.updatePassword(req.user.id, password);
    if (updateError) throw new AppError(503, 'ERROR_CAMBIAR_CONTRASENA', 'No se pudo actualizar la contraseña.');
    res.json({ success: true, data: { mensaje: 'La contraseña se actualizó correctamente.' } });
  } catch (error) {
    next(error);
  }
}

export function getCurrentProfile(req, res) {
  res.json({ success: true, data: { profile: req.user } });
}

export async function updateProfile(req, res, next) {
  try {
    const profile = profileSchema.parse(req.body);
    const updated = await UserModel.updateProfile(req.user.id, profile);
    res.json({ success: true, data: { ...updated, email: req.user.email, rol: req.user.rol } });
  } catch (error) {
    next(error);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    const { image_data: imageData } = z.object({
      image_data: z.string().min(1).max(4_200_000),
    }).parse(req.body);
    const match = imageData.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) throw new AppError(400, 'IMAGEN_INVALIDA', 'La foto debe ser PNG, JPEG o WebP.');
    const mimeType = match[1];
    const image = Buffer.from(match[2], 'base64');
    const signatures = {
      'image/png': image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      'image/jpeg': image.length >= 3 && image[0] === 255 && image[1] === 216 && image[2] === 255,
      'image/webp': image.length >= 12 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP',
    };
    if (!signatures[mimeType] || image.length > 3 * 1024 * 1024) {
      throw new AppError(400, 'IMAGEN_INVALIDA', 'La imagen está dañada o supera el límite de 3 MB.');
    }

    const avatarUrl = await ProfileAvatarModel.save(req.user.id, mimeType, image);
    res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (error) {
    next(error);
  }
}
