-- GC-05: tabla para el refresh token de Google Calendar.
-- El cliente puede escribir/borrar su fila pero NO leerla (sin policy de SELECT):
-- solo la Edge Function calendar-token (service role) lee el refresh_token.

create table if not exists public.google_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.google_tokens enable row level security;

create policy "insert propio" on public.google_tokens
  for insert with check (auth.uid() = user_id);

create policy "update propio" on public.google_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete propio" on public.google_tokens
  for delete using (auth.uid() = user_id);
