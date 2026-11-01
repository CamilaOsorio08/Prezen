alter table public.notificaciones enable row level security;
create policy "notificacion_select_propia" on public.notificaciones
for select using (usuario_id = auth.uid());
create policy "notificacion_update_propia" on public.notificaciones
for update using (usuario_id = auth.uid()); 