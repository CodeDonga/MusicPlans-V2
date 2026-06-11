# SDD — MusicPlans

Este directorio contiene los 6 artefactos del proceso Spec-Driven Development.  
**Spec primero. Código después. Siempre.**

---

## Los 6 pasos

| Paso | Archivo | Propósito |
|---|---|---|
| 1 | [`1-constitucion.md`](1-constitucion.md) | Reglas no negociables: stack, arquitectura, convenciones, diseño, seguridad |
| 2 | [`2-especificacion/`](2-especificacion/) | Una spec por módulo: historias de usuario + criterios de aceptación + restricciones |
| 3 | [`3-planificacion.md`](3-planificacion.md) | Arquitectura técnica: contratos de contexto, flujos de datos, dependencias |
| 4 | [`4-tareas.md`](4-tareas.md) | Backlog de tareas atómicas con estado (✅ / 🔄 / ⬜ / 🚫) |
| 5 | [`5-implementacion.md`](5-implementacion.md) | Guía de cómo traducir una tarea a código + patrones establecidos |
| 6 | [`6-mantenimiento.md`](6-mantenimiento.md) | Protocolo de evolución: cómo cambiar cosas sin romper la trazabilidad |

---

## Specs por módulo

| Módulo | Archivo | Estado |
|---|---|---|
| Autenticación | [`2-especificacion/autenticacion.md`](2-especificacion/autenticacion.md) | Parcialmente implementado |
| Alumnos | [`2-especificacion/alumnos.md`](2-especificacion/alumnos.md) | Implementado |
| Talleres | [`2-especificacion/talleres.md`](2-especificacion/talleres.md) | Implementado |
| Agenda | [`2-especificacion/agenda.md`](2-especificacion/agenda.md) | Parcialmente implementado |
| Finanzas | [`2-especificacion/finanzas.md`](2-especificacion/finanzas.md) | Parcialmente implementado |
| Ajustes | [`2-especificacion/ajustes.md`](2-especificacion/ajustes.md) | Parcialmente implementado |
| Notificaciones | [`2-especificacion/notificaciones.md`](2-especificacion/notificaciones.md) | Parcialmente implementado |
| Google Calendar | [`2-especificacion/google-calendar.md`](2-especificacion/google-calendar.md) | Parcialmente implementado |
| Vista Web Alumno | [`2-especificacion/vista-alumno.md`](2-especificacion/vista-alumno.md) | Pendiente |
| Pagos Flow | [`2-especificacion/pagos-flow.md`](2-especificacion/pagos-flow.md) | Pendiente |

---

## Regla de oro

Antes de escribir una línea de código:  
→ ¿Existe la spec? → ¿Los criterios de aceptación son claros? → ¿La tarea está en el backlog?  
Si la respuesta es no → escribe primero la spec.
