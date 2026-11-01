create table public.roles (
  id serial primary key,
  nombre varchar(20) unique not null
);
insert into public.roles (nombre) values
  ('admin'), ('coordinador'), ('director_grupo'), ('padre_familia'), ('estudiante');

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre varchar(100) not null,
  rol_id int not null references public.roles(id) default 5, -- 5 = 'estudiante'
  estado varchar(10) not null default 'activo' check (estado in ('activo', 'inactivo')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, rol_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'rol_id')::int, 5)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();