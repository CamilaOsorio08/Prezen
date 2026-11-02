create table public.grupos (
  id serial primary key,
  nombre varchar(20) not null,
  jornada varchar(10) not null check (jornada in ('mañana', 'tarde')),
  anio_lectivo varchar(9) not null,
  director_usuario_id uuid references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create table public.coordinadores_grupo (
  id serial primary key,
  grupo_id int not null references public.grupos(id) on delete cascade,
  coordinador_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  unique (grupo_id, coordinador_usuario_id)
);

create table public.estudiantes_grupo (
  id serial primary key,
  grupo_id int not null references public.grupos(id) on delete cascade,
  estudiante_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  codigo_qr varchar(50) unique not null,
  estado varchar(10) not null default 'activo' check (estado in ('activo', 'retirado')),
  creado_en timestamptz not null default now(),
  unique (grupo_id, estudiante_usuario_id)
);

create table public.acudientes_estudiante (
  id serial primary key,
  padre_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estudiante_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  parentesco varchar(30) not null default 'acudiente',
  unique (padre_usuario_id, estudiante_usuario_id)
);