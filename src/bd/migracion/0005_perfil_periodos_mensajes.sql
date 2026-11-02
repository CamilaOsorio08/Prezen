alter table public.usuarios
  add column if not exists telefono varchar(30),
  add column if not exists avatar_url text;

create table if not exists public.periodos_academicos (
  id serial primary key,
  grupo_id int not null references public.grupos(id) on delete cascade,
  numero smallint not null check (numero between 1 and 3),
  fecha_inicio date not null,
  fecha_fin date not null,
  constraint periodos_academicos_fechas_validas check (fecha_fin >= fecha_inicio),
  constraint periodos_academicos_grupo_numero_unico unique (grupo_id, numero)
);

create table if not exists public.comunicaciones (
  id serial primary key,
  remitente_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  destinatario_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estudiante_usuario_id uuid references public.usuarios(id) on delete set null,
  grupo_id int references public.grupos(id) on delete set null,
  asunto varchar(160) not null,
  contenido text not null,
  creado_en timestamptz not null default now(),
  leido_en timestamptz
);

create index if not exists idx_comunicaciones_remitente_fecha
  on public.comunicaciones (remitente_usuario_id, creado_en desc);
create index if not exists idx_comunicaciones_destinatario_fecha
  on public.comunicaciones (destinatario_usuario_id, creado_en desc);
