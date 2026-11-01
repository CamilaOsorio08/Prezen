create or replace function public.rol_actual()
returns text
language sql stable security definer set search_path = public
as $$
  select r.nombre from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where u.id = auth.uid()
$$;

create or replace function public.es_acudiente_de(p_estudiante_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.acudientes_estudiante
    where estudiante_usuario_id = p_estudiante_id and padre_usuario_id = auth.uid()
  )
$$;

create or replace function public.coordina_grupo(p_grupo_id int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.coordinadores_grupo
    where grupo_id = p_grupo_id and coordinador_usuario_id = auth.uid()
  )
$$;