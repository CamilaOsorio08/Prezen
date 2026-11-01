alter table public.grupos enable row level security;
create policy "grupo_select_involucrados" on public.grupos
for select using (
  director_usuario_id = auth.uid()
  or coordina_grupo(id)
  or rol_actual() = 'admin'
  or exists (select 1 from public.estudiantes_grupo eg where eg.grupo_id = grupos.id and eg.estudiante_usuario_id = auth.uid())
);

alter table public.coordinadores_grupo enable row level security;
create policy "coordinador_grupo_select" on public.coordinadores_grupo
for select using (coordinador_usuario_id = auth.uid() or rol_actual() = 'admin');

alter table public.acudientes_estudiante enable row level security;
create policy "acudiente_select_propio" on public.acudientes_estudiante
for select using (padre_usuario_id = auth.uid() or rol_actual() = 'admin');