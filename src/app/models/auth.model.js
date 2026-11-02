import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { createSupabaseAuthClient } from '../config/supabaseAuth.js';

export const AuthModel = {
  signIn(credentials) {
    return createSupabaseAuthClient().auth.signInWithPassword(credentials);
  },

  refresh(refreshToken) {
    return createSupabaseAuthClient().auth.refreshSession({ refresh_token: refreshToken });
  },

  getUserFromAccessToken(accessToken) {
    return supabaseAdmin.auth.getUser(accessToken);
  },

  requestPasswordReset(email, redirectTo) {
    return createSupabaseAuthClient().auth.resetPasswordForEmail(email, { redirectTo });
  },

  async resetPasswordWithRecoveryToken(tokenHash, password) {
    const client = createSupabaseAuthClient();
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (error || !data.session) {
      return { error: error || new Error('No se pudo validar el enlace de recuperación.'), stage: 'verification' };
    }
    return { ...(await client.auth.updateUser({ password })), stage: 'password' };
  },

  updatePassword(userId, password) {
    return supabaseAdmin.auth.admin.updateUserById(userId, { password });
  },
};
