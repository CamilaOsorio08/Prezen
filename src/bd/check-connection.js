import { supabaseAdmin } from '../app/config/supabaseAdmin.js';

async function verificar() {
  // 1) La URL y la service_role key son válidas (consulta al módulo Auth)
  const { error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (authError) {
    console.error('❌ Auth: no se pudo conectar →', authError.message);
    process.exit(1);
  }
  console.log('✅ Auth: conexión y service_role key correctas');

  // 2) La base de datos responde y las migraciones corrieron
  const { error: dbError, count } = await supabaseAdmin
    .from('roles')
    .select('*', { count: 'exact', head: true });

  if (!dbError) {
    console.log(`✅ BD: tabla "roles" accesible (${count} filas)`);
  } else if (['42P01', 'PGRST205'].includes(dbError.code)) {
    console.warn('⚠️  BD: la tabla "roles" aún no existe. Es normal si no has ejecutado la Fase 2.');
  } else {
    console.error('❌ BD: error al leer "roles" →', dbError.message);
    process.exit(1);
  }
}

verificar();
