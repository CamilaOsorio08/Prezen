alter table public.registros_asistencia enable row level security;

create policy "registro_select_involucrados" on public.registros_asistencia
for select using (
  estudiante_usuario_id = auth.uid()
  or es_acudiente_de(estudiante_usuario_id)
  or rol_actual() in ('admin', 'director_grupo')
  or exists (
    select 1 from public.sesiones_asistencia s
    where s.id = registros_asistencia.sesion_id and coordina_grupo(s.grupo_id)
  )
);