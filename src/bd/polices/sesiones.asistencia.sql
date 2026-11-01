alter table public.sesiones_asistencia enable row level security;

create policy "sesion_select_involucrados" on public.sesiones_asistencia
for select using (
  coordina_grupo(grupo_id)
  or rol_actual() in ('admin', 'director_grupo')
  or exists (
    select 1 from public.estudiantes_grupo eg
    where eg.grupo_id = sesiones_asistencia.grupo_id and eg.estudiante_usuario_id = auth.uid()
  )
);