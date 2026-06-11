# Modo de trabajo: Spec-Driven Development (SDD)

Este proyecto se desarrolla bajo la metodología **Spec-Driven Development**, nivel **spec-anchored**. Las specs son la fuente de verdad; el código es derivado.

**Lectura obligatoria al inicio de cada sesión:**
- `sdd/0-metodologia.md` — documento técnico de referencia de SDD (definición, principios, fases, niveles de rigor)
- `sdd/0b-charla-metodologia.md` — charla de la metodología (si existe)
- `sdd/1-constitucion.md` — reglas no negociables del proyecto
- `sdd/4-tareas.md` — backlog y estado actual

**Reglas de operación:**
1. **Nunca codificar sin spec.** Si la spec del módulo no cubre el cambio, primero actualizar `sdd/2-especificacion/<modulo>.md`, luego implementar.
2. **Bugs se documentan antes de corregirse.** Añadir a `sdd/4-tareas.md` con ID (`BUG-XX`) antes de tocar código.
3. **Tareas atómicas.** Cada cambio debe corresponder a una tarea verificable de `sdd/4-tareas.md`. Si no existe, crearla.
4. **Trazabilidad.** Cualquier cambio en código debe poder rastrearse a una tarea y una spec.
5. **Humano en el ciclo.** Confirmar enfoque con el usuario antes de cambios no triviales.

# Expo HA CAMBIADO

Lee la documentación versionada exacta en https://docs.expo.dev/versions/v54.0.0/ antes de escribir cualquier código.
