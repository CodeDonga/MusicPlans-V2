-- ARQ-14: observabilidad. Tabla de logs de error para diagnóstico remoto sin
-- depender de un servicio externo. El cliente (authenticated) inserta sus propios
-- logs en producción; el profesor/dev los lee vía RLS, service_role ve todo.
-- Decisión 2026-06-13: logging propio en vez de Sentry (Sentry requiere cuenta + rebuild de APK).

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id),
  nivel text not null check (nivel in ('warn', 'error')),
  scope text,
  mensaje text,
  extra text,
  plataforma text,
  created_at timestamptz default now()
);

alter table public.error_logs enable row level security;

drop policy if exists error_logs_insert on public.error_logs;
create policy error_logs_insert on public.error_logs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists error_logs_select on public.error_logs;
create policy error_logs_select on public.error_logs
  for select to authenticated using (auth.uid() = user_id);

grant select, insert on public.error_logs to authenticated;
grant all on public.error_logs to service_role;
