import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/appError.js';

export const HealthModel = {
  async checkDatabase() {
    const { error } = await supabaseAdmin.from('roles').select('id', { head: true, count: 'exact' });
    if (error) {
      throw new AppError(503, 'BD_NO_DISPONIBLE', 'No se pudo conectar con Supabase.');
    }
  },
};
