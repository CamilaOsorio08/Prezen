import { supabaseAdmin } from '../config/supabaseAdmin.js';

export async function obtenerEstadisticas() {
  const [{ count: totalEstudiantes }, { count: sesionesHoy }, { count: gruposActivos }] = await Promise.all([
    supabaseAdmin.from('estudiantes_grupo').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabaseAdmin.from('sesiones_asistencia').select('*', { count: 'exact', head: true }).eq('fecha', new Date().toISOString().slice(0, 10)),
    supabaseAdmin.from('grupos').select('*', { count: 'exact', head: true }),
  ]);
  return { totalEstudiantes, sesionesHoy, gruposActivos };
}

<script type="module">
  import { supabase } from '../public/assets/js/lib/supabaseClient.js';
  const { data: { session } } = await supabase.auth.getSession();
  const respuesta = await fetch('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${session.access_token}` } });
  const { success, data, error } = await respuesta.json();

  if (!success) {
    alert('No se pudieron cargar las estadísticas: ' + error.message);
  } else {
    document.querySelector('[data-stat="estudiantes"]').textContent = data.totalEstudiantes;
    document.querySelector('[data-stat="sesiones-hoy"]').textContent = data.sesionesHoy;
    document.querySelector('[data-stat="grupos"]').textContent = data.gruposActivos;
  }
</script>