# Especificación — Notificaciones Push
> Módulo: `lib/notificaciones.js`

---

## Historia de usuario

**Como** profesor de música,  
**quiero** recibir una notificación 1 hora antes de cada sesión,  
**para** no olvidar mis clases y llegar preparado.

---

## Criterios de aceptación

- [ ] Al crear una clase → se programa una notificación local 1 hora antes de `fecha + hora`.
- [ ] Al editar una clase (nueva fecha/hora) → se cancela la notificación anterior y se programa una nueva.
- [ ] Al cambiar estado a `cancelada` → se cancela la notificación programada.
- [ ] Al cambiar estado de `cancelada` a otro estado → se vuelve a programar la notificación (si la clase sigue en el futuro).
- [ ] Al eliminar una clase → se cancela la notificación programada.
- [x] Si la clase está en el pasado, o a menos de 1 hora del momento actual, no se programa notificación (no es posible avisar 1h antes).
- [x] Al iniciar sesión la app llama `solicitarPermisos()`; el OS muestra el diálogo solo la primera vez y guarda la respuesta.
- [ ] Texto de la notificación: "Clase con [nombre alumno/taller] en 1 hora".

---

## Restricciones técnicas

- Implementar con `expo-notifications` (local notifications, no push remoto).
- `programarNotificacion(claseId, nombreEntidad, fecha, hora)` — retorna el ID de la notificación schedulada.
- `cancelarNotificacion(claseId)` — cancela por ID.
- El `claseId` de Supabase se usa como identificador de la notificación para poder cancelarla.
- Las notificaciones se almacenan solo en el dispositivo (no en Supabase).

---

## Estado actual

- **Implementado:** `programarNotificacion`, `cancelarNotificacion` en `lib/notificaciones.js`.
- **Pendiente:** solicitud de permisos al primer uso, manejo de clase en el pasado.
