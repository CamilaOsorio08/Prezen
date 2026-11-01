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
};
