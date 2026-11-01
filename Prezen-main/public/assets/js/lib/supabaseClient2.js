import { supabase } from '../../assets/js/lib/supabaseClient.js';

async function obtenerMiCodigoQr() {
  const { data } = await supabase
    .from('estudiantes_grupo')
    .select('codigo_qr')
    .eq('estudiante_usuario_id', (await supabase.auth.getUser()).data.user.id)
    .single();
  return data?.codigo_qr;
}

async function llamarApi(ruta, metodo, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const respuesta = await fetch(`/api/v1${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await respuesta.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

let sesionActivaId = null;

document.getElementById('btnAbrirSesion').addEventListener('click', async () => {
  try {
    const sesion = await llamarApi('/sesiones', 'POST', { grupo_id: grupoActualId, tipo: 'entrada' });
    sesionActivaId = sesion.id;
    showToast('Sesión de asistencia abierta.');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Esto reemplaza el "no hace nada" que hoy sigue al escaneo exitoso de Html5Qrcode
const html5QrCode = new Html5Qrcode('lector-qr');
html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, async (codigoDecodificado) => {
  try {
    const registro = await llamarApi('/asistencia/qr', 'POST', { sesion_id: sesionActivaId, codigo_qr: codigoDecodificado });
    showToast(`Asistencia registrada: ${registro.estudiante_usuario_id}`);
  } catch (err) {
    showToast(err.message, 'error'); // ej. "ASISTENCIA_DUPLICADA"
  }
});