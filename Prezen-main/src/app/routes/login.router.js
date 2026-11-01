import { supabase } from '../assets/js/lib/supabaseClient.js';

const loginForm = document.getElementById('loginForm');

function mensajeDeError(error) {
  const mapa = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',
  };
  return mapa[error.message] || 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
  if (error) {
    document.getElementById('loginError').textContent = mensajeDeError(error);
    return;
  }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('roles(nombre)')
    .eq('id', data.user.id)
    .single();

  const destinos = {
    admin: 'dashboard.html',
    coordinador: '../panel_control/coordinadores/',
    director_grupo: '../panel_control/directores_grupo/',
    padre_familia: '../panel_control/padres_familia/',
    estudiante: '../panel_control/estudiantes/',
  };

  // Se conserva la pantalla de transición que ya existe
  sessionStorage.setItem('destinoPostLogin', destinos[perfil.roles.nombre] || destinos.estudiante);
  window.location.href = 'welcome.html';
});