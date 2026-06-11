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
- [ ] **El token de Google nunca se persiste** (BUG-07/BUG-21): vive solo en `session.provider_token`. En `user_metadata` se guarda únicamente el flag `google_calendar_connected`.
- [ ] Si no hay token disponible → las funciones de calendario fallan silenciosamente (sin error visible al usuario).
- [ ] Si Google responde 401 (token vencido) → se lanza `TOKEN_EXPIRADO`, `safeGCal` avisa con Alert y pide reconectar desde Ajustes.

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

### Conflictos de horario (GC-06)

Definición: la detección es **local**, contra las clases de la app (no consulta la API de Google — eso queda como mejora futura vía freeBusy).

- [ ] Un conflicto existe cuando otra clase **no cancelada** (de cualquier alumno/taller) cae en la misma fecha y sus ventanas de 60 minutos se superponen (`|inicioA − inicioB| < 60 min`).
- [ ] Al guardar una clase nueva con conflicto → Alert "Conflicto de horario: ya tienes una clase con {nombre} a las {hora}hs ese día. ¿Guardar igual?" con botones Cancelar / Guardar igual.
- [ ] Al editar una clase, la propia clase se excluye de la comparación.
- [ ] "Guardar igual" guarda la clase normalmente; "Cancelar" mantiene el formulario abierto sin efectos.

### Reactivación (BUG-23)
- [ ] Al reactivar una clase cancelada (por cambio de estado o edición) sin `google_event_id` → se crea un evento nuevo y se persiste su id.

---

## Restricciones técnicas

- API directa de Google Calendar REST (no SDK).
- El token se obtiene con `getCalendarToken()` de `AuthContext` o `getGoogleToken()` de `AlumnosContext`.
- Fallos de Google Calendar nunca bloquean la operación principal (crear/editar/eliminar clase).
- `google_event_id` en Supabase se limpia a `null` cuando el evento es eliminado de Calendar.

---

## Estado actual

- **Implementado:** `crearEvento`, `editarEvento`, `eliminarEvento`, aviso de token vencido (`TOKEN_EXPIRADO` + Alert), recreación de evento al reactivar, detección local de conflictos (GC-06).
- **Pendiente (GC-05):** refresh automático del token. **Bloqueado**: requiere una Edge Function con el client secret de Google para canjear el `provider_refresh_token` — no puede hacerse de forma segura desde el cliente. Retomar cuando exista backend (la infra de pagos traerá Edge Functions).
