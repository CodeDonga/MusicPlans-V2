-- BUG-35: el rol `authenticated` necesita poder hacer upsert de su propia fila
-- en google_tokens (INSERT ... ON CONFLICT DO UPDATE al reconectar Calendar).
-- ON CONFLICT exige privilegio SELECT a nivel de tabla. RLS NO tiene policy de
-- SELECT, asi que el refresh_token sigue siendo ilegible desde el cliente
-- (verificado: un select como authenticated devuelve 0 filas). Este grant solo
-- habilita el chequeo interno de privilegios del upsert, no expone datos.
grant select on public.google_tokens to authenticated;
