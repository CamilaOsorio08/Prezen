import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../src/lib/AppError.js';

async function crearRegistro({ sesion_id, estudiante_usuario_id, metodo, estado, registrado_por_usuario_id }) {
  const { data: registro, error } = await supabaseAdmin
    .from('registros_asistencia')
    .insert({ sesion_id, estudiante_usuario_id, metodo, estado, registrado_por_usuario_id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'ASISTENCIA_DUPLICADA', 'Este estudiante ya tiene asistencia registrada en esta sesión.');
    }
    throw new AppError(400, 'ERROR_REGISTRAR_ASISTENCIA', error.message);
  }

  // Notificar a todos los acudientes del estudiante
  const { data: acudientes } = await supabaseAdmin
    .from('acudientes_estudiante')
    .select('padre_usuario_id')
    .eq('estudiante_usuario_id', estudiante_usuario_id);

  const notificaciones = (acudientes || []).map((a) => ({
    usuario_id: a.padre_usuario_id,
    tipo: 'asistencia_registrada',
    contenido: `Se registró asistencia (${estado}) para tu hijo/a.`,
    referencia_tipo: 'registro_asistencia',
    referencia_id: registro.id,
  }));
  if (notificaciones.length) await supabaseAdmin.from('notificaciones').insert(notificaciones);

  return registro;
}

export async function registrarPorQr(coordinadorId, sesionId, codigoQr) {
  const { data: matricula } = await supabaseAdmin
    .from('estudiantes_grupo')
    .select('estudiante_usuario_id, estado')
    .eq('codigo_qr', codigoQr)
    .maybeSingle();

  if (!matricula || matricula.estado !== 'activo') {
    throw new AppError(404, 'CODIGO_QR_INVALIDO', 'El código QR no corresponde a ningún estudiante activo.');
  }

  return crearRegistro({
    sesion_id: sesionId,
    estudiante_usuario_id: matricula.estudiante_usuario_id,
    metodo: 'qr',
    estado: 'presente',
    registrado_por_usuario_id: coordinadorId,
  });
}

export async function registrarManual(coordinadorId, sesionId, estudianteId, estado) {
  return crearRegistro({
    sesion_id: sesionId,
    estudiante_usuario_id: estudianteId,
    metodo: 'manual',
    estado,
    registrado_por_usuario_id: coordinadorId,
  });
}