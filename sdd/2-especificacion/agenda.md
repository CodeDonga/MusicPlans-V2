# Especificación — Agenda
> Módulo: `app/(tabs)/agenda.jsx`

---

## Historia de usuario

**Como** profesor de música,  
**quiero** ver todas mis próximas sesiones en orden cronológico,  
**para** planificar mi semana y saber qué clases tengo pendientes.

---

## Criterios de aceptación

- [ ] Muestra todas las clases con estado `pendiente` o `realizada` de todos los alumnos y talleres, ordenadas por fecha + hora ascendente.
- [ ] No muestra clases con estado `cancelada`.
- [ ] Cada ítem muestra: nombre del alumno/taller, fecha (formato legible en español), hora, badge de estado.
- [ ] Badge "En Curso": aparece cuando la hora actual es >= hora de inicio y < hora de inicio + 60 minutos, y la clase es hoy y está pendiente. El cambio ocurre exactamente al llegar la hora, sin retraso.
- [ ] Presionar un ítem → navega al perfil del alumno/taller correspondiente.
- [ ] Lista vacía → estado vacío con mensaje "Sin clases próximas".
- [ ] Agrupa las clases por fecha (encabezado de día: "Lunes 3 de junio").

---

## Restricciones técnicas

- Los datos vienen de `AlumnosContext.clases` — no hace fetch propio a Supabase.
- El ordenamiento es en memoria (no en la query de Supabase).
- Fechas en formato `YYYY-MM-DD`, horas en `HH:MM` — formatear para mostrar en español.

---

## Estado actual

- **Implementado:** lista de próximas sesiones.
- **Pendiente:** agrupación por fecha, filtros por estado.
