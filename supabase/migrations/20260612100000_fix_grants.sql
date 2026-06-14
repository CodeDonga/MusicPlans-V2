-- BUG-30: privilegios rotos detectados en la auditoría ARQ-10 (2026-06-12).
-- Síntomas: google_tokens con 0 filas (authenticated no podía INSERT → el
-- refresh token nunca se guardó → GC-05 no refrescaba); service_role sin
-- SELECT en ninguna tabla (la Edge Function calendar-token no podía leer);
-- TRUNCATE concedido a anon/authenticated (no respeta RLS).

-- 1. El cliente debe poder escribir su refresh token (RLS sigue limitando a
--    su propia fila). Sin SELECT: el token nunca es legible desde la app.
grant insert, update, delete on public.google_tokens to authenticated;

-- 2. Las Edge Functions (service role) recuperan acceso completo.
grant all on all tables in schema public to service_role;

-- 3. TRUNCATE no respeta RLS: fuera para roles de cliente.
revoke truncate on all tables in schema public from anon, authenticated;

-- 4. anon no necesita ningún privilegio en este proyecto (la vista pública de
--    pagos irá vía Edge Function con service role).
revoke all on all tables in schema public from anon;

-- 5. Default privileges para tablas futuras creadas por postgres (migraciones):
--    hoy nacían con solo TRUNCATE/REFERENCES/TRIGGER para todos los roles.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
