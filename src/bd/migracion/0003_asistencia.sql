create table public.sesiones_asistencia (
  id serial primary key,
  grupo_id int not null references public.grupos(id) on delete cascade,
  coordinador_usuario_id uuid not null references public.usuarios(id),
  fecha date not null default current_date,
  tipo varchar(10) not null check (tipo in ('entrada', 'salida')),
  estado varchar(10) not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz,
  unique (grupo_id, fecha, tipo)
);

create table public.registros_asistencia (
  id serial primary key,
  sesion_id int not null references public.sesiones_asistencia(id) on delete cascade,
  estudiante_usuario_id uuid not null references public.usuarios(id),
  metodo varchar(10) not null check (metodo in ('qr', 'manual')),
  estado varchar(10) not null default 'presente' check (estado in ('presente', 'tardanza', 'ausente')),
  registrado_por_usuario_id uuid not null references public.usuarios(id),
  hora_registro timestamptz not null default now(),
  unique (sesion_id, estudiante_usuario_id)
);
create index idx_registros_sesion on public.registros_asistencia (sesion_id);