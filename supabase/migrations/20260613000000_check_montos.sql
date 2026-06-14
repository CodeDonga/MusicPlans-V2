-- ARQ-17: validación de montos en DB. Hoy solo se valida con parseInt en cliente.
-- Rango: >= 0 (un valor 0 es válido: clase de cortesía / valor aún sin definir) y
-- techo holgado de 10.000.000 CLP para atajar typos/overflow (el máximo real es ~105.000).
-- Idempotente: drop + add con nombres explícitos.

alter table public.alumnos drop constraint if exists alumnos_valor_clase_rango;
alter table public.alumnos add constraint alumnos_valor_clase_rango
  check (valor_clase >= 0 and valor_clase <= 10000000);

alter table public.talleres drop constraint if exists talleres_valor_por_alumno_rango;
alter table public.talleres add constraint talleres_valor_por_alumno_rango
  check (valor_por_alumno >= 0 and valor_por_alumno <= 10000000);

alter table public.clases drop constraint if exists clases_valor_unitario_rango;
alter table public.clases add constraint clases_valor_unitario_rango
  check (valor_unitario >= 0 and valor_unitario <= 10000000);

-- valor_custom es un override opcional: null permitido.
alter table public.clases drop constraint if exists clases_valor_custom_rango;
alter table public.clases add constraint clases_valor_custom_rango
  check (valor_custom is null or (valor_custom >= 0 and valor_custom <= 10000000));
