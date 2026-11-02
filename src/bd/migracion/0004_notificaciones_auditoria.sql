create table public.notificaciones (
  id serial primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo varchar(30) not null,
  contenido varchar(280) not null,
  referencia_tipo varchar(30),
  referencia_id int,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.auditoria_acciones (
  id serial primary key,
  admin_usuario_id uuid not null references public.usuarios(id),
  accion varchar(40) not null,
  objetivo_tipo varchar(30) not null,
  objetivo_id varchar(30) not null,
  creado_en timestamptz not null default now()
);