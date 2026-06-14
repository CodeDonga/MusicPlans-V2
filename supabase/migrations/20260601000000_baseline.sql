-- ARQ-10: baseline del esquema que existía solo en el dashboard (alumnos,
-- talleres, clases). Capturado de producción el 2026-06-12 vía Management API.
-- Idempotente: en producción ya existe todo; en un entorno nuevo lo crea.
-- google_tokens vive en su propia migración (20260611120000).

create table if not exists public.alumnos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  nombre text not null,
  instrumento text,
  avatar text,
  whatsapp text,
  valor_clase numeric default 0,
  dia_semana text,
  hora text,
  tipo text default 'alumno',
  created_at timestamptz default now()
);

create table if not exists public.talleres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  nombre text not null,
  instrumento text,
  avatar text,
  valor_por_alumno numeric default 0,
  dia_semana text,
  hora text,
  tipo text default 'taller',
  participantes jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- entidad_id es polimórfico (alumno o taller): sin FK por diseño.
create table if not exists public.clases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  entidad_id uuid not null,
  entidad_tipo text not null check (entidad_tipo in ('alumno', 'taller')),
  entidad_nombre text,
  fecha text,
  hora text,
  planificacion text,
  tareas text,
  estado text default 'pendiente',
  pagada boolean default false,
  valor_unitario numeric default 0,
  valor_custom numeric,
  google_event_id text,
  created_at timestamptz default now()
);

alter table public.alumnos enable row level security;
alter table public.talleres enable row level security;
alter table public.clases enable row level security;

drop policy if exists profesor_alumnos on public.alumnos;
create policy profesor_alumnos on public.alumnos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists profesor_talleres on public.talleres;
create policy profesor_talleres on public.talleres
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists profesor_clases on public.clases;
create policy profesor_clases on public.clases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
