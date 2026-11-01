import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';
import { UserModel } from './user.model.js';

const BUCKET_NAME = 'profile-avatars';

export const ProfileAvatarModel = {
  async save(userId, mimeType, image) {
    const { data: buckets, error: bucketListError } = await supabaseAdmin.storage.listBuckets();
    if (bucketListError) {
      throw new AppError(503, 'ERROR_GUARDAR_FOTO', 'No se pudo validar el almacenamiento de fotos.');
    }
    if (!buckets.some((bucket) => bucket.name === BUCKET_NAME)) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: '3MB',
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      });
      if (error) throw new AppError(503, 'ERROR_GUARDAR_FOTO', 'No se pudo preparar el almacenamiento de fotos.');
    }

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice('image/'.length);
    const objectPath = `${userId}/avatar.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(objectPath, image, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '3600',
    });
    if (uploadError) throw new AppError(503, 'ERROR_GUARDAR_FOTO', 'No se pudo guardar la foto de perfil.');

    const { data: publicUrl } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
    const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
    await UserModel.updateAvatarUrl(userId, avatarUrl);
    return avatarUrl;
  },
};
