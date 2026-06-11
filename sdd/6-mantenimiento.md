# Protocolo de Mantenimiento — MusicPlans
> Cómo evolucionar el sistema sin romper la alineación spec ↔ código.

---

## Regla principal

> **Spec primero. Código después. Siempre.**

Si quieres cambiar un comportamiento:
1. Modificar la spec en `2-especificacion/[módulo].md`.
2. Actualizar `4-tareas.md` si hay tareas nuevas o que cambian.
3. Actualizar `3-planificacion.md` si cambian contratos o arquitectura.
4. Implementar el cambio en código.
5. Actualizar el estado en `4-tareas.md` (✅).

Si cambias código sin pasar por la spec → el proyecto pierde trazabilidad y SDD no funciona.

---

## Cuándo actualizar cada documento

| Documento | Actualizar cuando... |
|---|---|
| `1-constitucion.md` | Cambia el stack, las convenciones o las reglas de seguridad. Requiere consenso. |
| `2-especificacion/[módulo].md` | Cambia el comportamiento esperado, se agregan o eliminan criterios de aceptación. |
| `3-planificacion.md` | Cambian los contratos de contexto, la estructura de carpetas o las dependencias externas. |
| `4-tareas.md` | Se completa una tarea, se agrega una nueva, cambia el estado de una. |
| `5-implementacion.md` | Se establece un nuevo patrón de código reutilizable. |
| `6-mantenimiento.md` | Cambia el protocolo de trabajo del equipo. |

---

## Agregar una funcionalidad nueva

1. Escribir la spec en `2-especificacion/nueva-feature.md` con historia de usuario y criterios de aceptación.
2. Agregar las tareas atómicas en `4-tareas.md` con estado ⬜.
3. Si afecta la arquitectura → actualizar `3-planificacion.md`.
4. Implementar tarea por tarea, marcando ✅ al terminar cada una.

---

## Detectar desviaciones

Señales de que el código se alejó de la spec:
- Una pantalla hace algo que no está en los criterios de aceptación → agregar a la spec o revertir.
- Un contexto expone una función que no está en los contratos de `3-planificacion.md` → actualizar planificación.
- Hay código muerto o pantallas sin spec → definir spec o eliminar código.

---

## Versionado

- Las specs se versionan junto con el código en git.
- Cada commit que cambia comportamiento debe incluir el cambio en la spec correspondiente.
- Los commits de solo-spec (sin código) son válidos y bienvenidos.
