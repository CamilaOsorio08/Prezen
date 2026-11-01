alter table public.estudiantes_grupo enable row level security;

create policy "estudiante_grupo_select" on public.estudiantes_grupo
for select using (
  estudiante_usuario_id = auth.uid()
  or es_acudiente_de(estudiante_usuario_id)
  or coordina_grupo(grupo_id)
  or rol_actual() in ('admin', 'director_grupo')
);