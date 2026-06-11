# Especificación — Agenda (Calendario)
> Módulo: `app/(tabs)/agenda.jsx`
> Rediseñada como calendario mensual + timeline del día (commit c72543c). Esta spec describe el diseño vigente; la lista cronológica original quedó obsoleta.

---

## Historia de usuario

**Como** profesor de música,  
**quiero** ver mis clases en un calendario mensual y el detalle de cada día,  
**para** planificar mi semana y saber qué clases tengo en cada fecha.

---

## Criterios de aceptación

### Calendario mensual
- [x] Grilla de 6 semanas (42 celdas) con los días del mes activo; días de meses vecinos atenuados.
- [x] Navegación de mes: flechas ‹ › y swipe horizontal (sin bloquear el scroll vertical).
- [x] Día con clases → borde destacado en color primario.
- [x] Día de hoy → borde en `paleta.onSurface`, sin relleno.
- [x] Día seleccionado → relleno primario.
- [x] Subtítulo bajo el mes: cantidad de clases programadas **para hoy** (no para el día seleccionado), con singular/plural correcto.

### Timeline del día seleccionado
- [x] Encabezado "Agenda: {Día} {N}" (cumple AG-03 — el encabezado de día agrupa las clases por fecha).
- [x] Badge "Tiempo Real" cuando el día seleccionado es hoy.
- [x] Clases del día ordenadas por hora ascendente, con avatar, nombre, hora y badge de estado.
- [x] Estados visibles: Pendiente, Completada, Cancelada, Reagendada (`paleta.warning`), En Curso.
- [x] Badge "En Curso": hora actual >= hora de inicio y < inicio + 60 min, clase de hoy y pendiente. El cambio ocurre exactamente al llegar la hora (timeout programado, no polling).
- [x] Presionar un ítem → navega al perfil del alumno/taller.
- [x] Día sin clases → estado vacío "Sin clases este día" (cumple AG-04).

### Stats y accesos
- [x] Progreso semanal: % de clases realizadas sobre el total de la semana (lunes a domingo).
- [x] Acceso "Nueva Clase" → tab Alumnos. Acceso "Reporte" → tab Finanzas (con `router.navigate`, no `push`).
- [x] FAB "Google Calendar" → abre calendar.google.com.

---

## Restricciones técnicas

- Los datos vienen de `AlumnosContext.clases` — no hace fetch propio a Supabase.
- Ordenamiento y agrupación en memoria.
- Fechas `DD/MM/YYYY` (o `YYYY-MM-DD` legacy) parseadas con `lib/fechas.js:parseFecha`; horas `HH:MM`.
- A diferencia de la spec original, las clases canceladas **sí se muestran** en el timeline del día con su badge (decisión del rediseño: el día conserva su historia).

---

## Estado actual

- **Implementado:** todo lo anterior. AG-03 y AG-04 quedan satisfechas por el rediseño.
- **Pendiente:** filtros por estado (idea futura, sin tarea asociada).
