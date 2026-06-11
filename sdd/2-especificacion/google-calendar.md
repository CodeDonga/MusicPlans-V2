# Especificación — Google Calendar
> Módulo: `lib/googleCalendar.js`, `context/AuthContext.jsx` (conectarCalendar, getCalendarToken)

---

## Historia de usuario

**Como** profesor de música,  
**quiero** que mis clases se sincronicen automáticamente con Google Calendar,  
**para** tener toda mi agenda en un solo lugar.

---

## Criterios de aceptación

### Conexión
- [ ] El profesor puede conectar su Google Calendar desde la pantalla Ajustes.
- [ ] La conexión solicita el scope `calendar.events` con `access_type: offline`.
- [ ] El `provider_token` (token de Google) se guarda en `user_metadata.google_calendar_token`.
- [ ] Si no hay token conectado → las funciones de calendario fallan silenciosamente (sin error visible al usuario).

### Crear evento
- [ ] Al crear una clase con estado != `cancelada` → intenta crear un evento en Google Calendar.
- [ ] El evento incluye: título ("Clase con [nombre]"), fecha, hora, duración por defecto (1 hora).
- [ ] Si la creación es exitosa → guarda `google_event_id` en la clase en Supabase.
- [ ] Si falla (token vencido, sin conexión) → la clase se crea igual, sin evento.

### Editar evento
- [ ] Al editar una clase que tiene `google_event_id` → actualiza el evento en Google Calendar.
- [ ] Si el estado cambia a `cancelada` → elimina el evento y limpia `google_event_id`.

### Eliminar evento
- [ ] Al eliminar una clase con `google_event_id` → elimina el evento de Google Calendar.
- [ ] Al cancelar una clase con `google_event_id` → elimina el evento de Google Calendar.

### Conflictos de horario
- [ ] Si al crear una clase hay conflicto de horario → alerta al profesor y pregunta si reagendar. _(por definir implementación)_

---

## Restricciones técnicas

- API directa de Google Calendar REST (no SDK).
- El token se obtiene con `getCalendarToken()` de `AuthContext` o `getGoogleToken()` de `AlumnosContext`.
- Fallos de Google Calendar nunca bloquean la operación principal (crear/editar/eliminar clase).
- `google_event_id` en Supabase se limpia a `null` cuando el evento es eliminado de Calendar.

---

## Estado actual

- **Implementado:** `crearEvento`, `editarEvento`, `eliminarEvento` en `lib/googleCalendar.js`.
- **Pendiente:** manejo de token vencido (refresh automático), detección de conflictos.
