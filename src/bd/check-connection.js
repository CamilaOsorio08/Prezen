import { supabaseAdmin } from '../app/config/supabaseAdmin.js';

const columnasMigraciones = {
  roles: 'id,nombre',
  usuarios: 'id,nombre,telefono,avatar_url,rol_id,estado,creado_en,actualizado_en',
  grupos: 'id,nombre,jornada,anio_lectivo,director_usuario_id,creado_en',
  coordinadores_grupo: 'id,grupo_id,coordinador_usuario_id',
  estudiantes_grupo: 'id,grupo_id,estudiante_usuario_id,codigo_qr,estado,creado_en',
  acudientes_estudiante: 'id,padre_usuario_id,estudiante_usuario_id,parentesco',
  sesiones_asistencia: 'id,grupo_id,coordinador_usuario_id,fecha,tipo,estado,abierta_en,cerrada_en',
  registros_asistencia: 'id,sesion_id,estudiante_usuario_id,metodo,estado,registrado_por_usuario_id,hora_registro',
  notificaciones: 'id,usuario_id,tipo,contenido,referencia_tipo,referencia_id,leida,creado_en',
  auditoria_acciones: 'id,admin_usuario_id,accion,objetivo_tipo,objetivo_id,creado_en',
  periodos_academicos: 'id,grupo_id,numero,fecha_inicio,fecha_fin',
  comunicaciones: 'id,remitente_usuario_id,destinatario_usuario_id,estudiante_usuario_id,grupo_id,asunto,contenido,creado_en,leido_en',
};

const rolesEsperados = ['admin', 'coordinador', 'director_grupo', 'padre_familia', 'estudiante'];

async function verificar() {
  let hayErrores = false;

  // Verifica que la URL y la service_role key permitan consultar Supabase Auth.
  const { error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (authError) {
    console.error('❌ Auth: no se pudo conectar →', authError.message);
    hayErrores = true;
  } else {
    console.log('✅ Auth: conexión y service_role key correctas');
  }

  for (const [tabla, columnas] of Object.entries(columnasMigraciones)) {
    const { error } = await supabaseAdmin
      .from(tabla)
      .select(columnas, { head: true })
      .limit(0);

    if (error) {
      console.error(`❌ BD: ${tabla} no coincide con las migraciones → ${error.code || ''} ${error.message}`);
      hayErrores = true;
    } else {
      console.log(`✅ BD: ${tabla} y sus columnas existen`);
    }
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('roles')
    .select('nombre');

  if (rolesError) {
    console.error(`❌ BD: no se pudieron verificar los roles iniciales → ${rolesError.message}`);
    hayErrores = true;
  } else {
    const nombresExistentes = new Set(roles.map(({ nombre }) => nombre));
    const rolesFaltantes = rolesEsperados.filter((nombre) => !nombresExistentes.has(nombre));

    if (rolesFaltantes.length) {
      console.error(`❌ BD: faltan roles iniciales → ${rolesFaltantes.join(', ')}`);
      hayErrores = true;
    } else {
      console.log('✅ BD: están cargados los cinco roles iniciales');
    }
  }

  if (hayErrores) process.exitCode = 1;
  else console.log('✅ Verificación de tablas, columnas y roles terminada');
}

verificar();
