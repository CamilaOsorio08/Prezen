import { z } from 'zod';
import { AuthModel } from '../models/auth.model.js';
import { ProfileAvatarModel } from '../models/profile-avatar.model.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../../lib/appError.js';

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
