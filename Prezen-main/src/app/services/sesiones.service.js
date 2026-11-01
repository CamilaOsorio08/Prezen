import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../src/lib/AppError.js';

export async function abrirSesion(coordinadorId, { grupo_id, tipo }) {
  const { data: asignado } = await supabaseAdmin
    .from('coordinadores_grupo')
    .select('id')
    .eq('grupo_id', grupo_id)
    .eq('coordinador_usuario_id', coordinadorId)
    .maybeSingle();

  if (!asignado) {
    throw new AppError(403, 'NO_ASIGNADO', 'No estás asignado como coordinador de este grupo.');
  }

  const { data: sesion, error } = await supabaseAdmin
    .from('sesiones_asistencia')
    .insert({ grupo_id, coordinador_usuario_id: coordinadorId, tipo })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'SESION_YA_ABIERTA', `Ya existe una sesión de ${tipo} para este grupo hoy.`);
    }
    throw new AppError(400, 'ERROR_ABRIR_SESION', error.message);
  }

  return sesion;
}

export async function cerrarSesion(sesionId) {
  const { data: sesion } = await supabaseAdmin
    .from('sesiones_asistencia')
    .select('grupo_id')
    .eq('id', sesionId)
    .single();

  if (!sesion) throw new AppError(404, 'SESION_NO_ENCONTRADA', 'La sesión no existe.');

  // Todos los estudiantes activos del grupo que NO tengan registro en esta sesión quedan como ausentes
  const { data: estudiantes } = await supabaseAdmin
    .from('estudiantes_grupo')
    .select('estudiante_usuario_id')
    .eq('grupo_id', sesion.grupo_id)
    .eq('estado', 'activo');

  const { data: registrados } = await supabaseAdmin
    .from('registros_asistencia')
    .select('estudiante_usuario_id')
    .eq('sesion_id', sesionId);

  const idsRegistrados = new Set((registrados || []).map((r) => r.estudiante_usuario_id));
  const ausentes = (estudiantes || [])
    .filter((e) => !idsRegistrados.has(e.estudiante_usuario_id))
    .map((e) => ({
      sesion_id: sesionId,
      estudiante_usuario_id: e.estudiante_usuario_id,
      metodo: 'manual',
      estado: 'ausente',
      registrado_por_usuario_id: null,
    }));

  if (ausentes.length) await supabaseAdmin.from('registros_asistencia').insert(ausentes);

  await supabaseAdmin
    .from('sesiones_asistencia')
    .update({ estado: 'cerrada', cerrada_en: new Date().toISOString() })
    .eq('id', sesionId);
}