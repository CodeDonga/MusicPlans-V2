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
- [ ] **El access token de Google nunca se persiste en el cliente** (BUG-07/BUG-21): vive solo en un ref en memoria de `AuthContext` (BUG-28). En `user_metadata` se guarda únicamente el flag `google_calendar_connected`.
- [ ] **Refresh automático (GC-05):** al conectar, el `provider_refresh_token` se guarda en la tabla `google_tokens` (server-side). Cuando el access token en memoria falta o está por vencer, el cliente invoca la Edge Function `calendar-token`, que canjea el refresh token con Google y devuelve un access token fresco. El usuario conecta Calendar **una sola vez**; no necesita reconectar tras 1 hora ni al reiniciar la app.
- [ ] Al desconectar Calendar se elimina la fila de `google_tokens` y se limpia el ref en memoria.
- [ ] Si no hay token disponible → las funciones de calendario fallan silenciosamente (sin error visible al usuario).
- [ ] Si Google responde 401 (token vencido) → se lanza `TOKEN_EXPIRADO` y se invalida el caché en memoria; la siguiente operación obtiene un token fresco automáticamente (GC-05). Sin Alert: ya no se requiere acción del usuario.
- [ ] Si el refresh falla porque el usuario revocó el acceso (`revoked`) o no hay refresh token guardado (`no_token`) → se limpia el flag `google_calendar_connected` y Ajustes vuelve a mostrar "conectar".

### Crear evento
- [ ] Al crear una clase con estado != `cancelada` → intenta crear un evento en Google Calendar.
- [ ] El evento incluye: título ("Clase con [nombre]"), fecha, hora, duración por defecto (1 hora).
- [ ] Si la creación es exitosa → guarda `google_event_id` en la clase en Supabase.
- [ ] Si falla (token vencido, sin conexión) → la clase se crea igual, sin evento.

### Editar evento
- [ ] Al editar una clase que tiene `google_event_id` → actualiza el evento en Google Calendar.
- [ ] Si el estado cambia a `cancelada` → elimina el evento y limpia `google_event_id`.
- [ ] **Auto-sanación (BUG-33):** si el PATCH responde 404/410 (el usuario borró el evento en Calendar), `editarEvento` devuelve `'gone'` y la app **recrea** el evento y persiste el nuevo id, en vez de asumir que existe.

### Eliminar evento
- [ ] Al eliminar una clase con `google_event_id` → elimina el evento de Google Calendar.
- [ ] Al cancelar una clase con `google_event_id` → elimina el evento de Google Calendar.
- [ ] **Fuente de verdad del id (BUG-29):** antes de eliminar o cancelar, el `google_event_id` se lee desde Supabase — no del estado en memoria, que puede no tener el id (p. ej. si se recargó desde la DB antes de que el id terminara de persistirse). Aplica a: eliminar clase, eliminar alumno/taller (clases no pagadas) y cancelar clase.
- [ ] `eliminarEvento` informa el resultado: 2xx/404/410 cuentan como éxito (el evento ya no existe en Calendar); cualquier otro status devuelve `false` y se loguea en desarrollo (`__DEV__`).
- [ ] La persistencia de `google_event_id` tras crear un evento (alta, reactivación, sincronización) verifica el error del UPDATE y lo loguea en desarrollo — antes fallaba en silencio (causa raíz de BUG-29).

### Conflictos de horario (GC-06)

Definición: la detección es **local**, contra las clases de la app (no consulta la API de Google — eso queda como mejora futura vía freeBusy).

- [ ] Un conflicto existe cuando otra clase **no cancelada** (de cualquier alumno/taller) cae en la misma fecha y sus ventanas de 60 minutos se superponen (`|inicioA − inicioB| < 60 min`).
- [ ] Al guardar una clase nueva con conflicto → Alert "Conflicto de horario: ya tienes una clase con {nombre} a las {hora}hs ese día. ¿Guardar igual?" con botones Cancelar / Guardar igual.
- [ ] Al editar una clase, la propia clase se excluye de la comparación.
- [ ] "Guardar igual" guarda la clase normalmente; "Cancelar" mantiene el formulario abierto sin efectos.

### Reactivación (BUG-23)
- [ ] Al reactivar una clase cancelada (por cambio de estado o edición) sin `google_event_id` → se crea un evento nuevo y se persiste su id.

### Sincronización de clases existentes
- [ ] `sincronizarClasesExistentes` (al conectar Calendar) crea un evento para **toda** clase no cancelada que no tenga ya un `google_event_id` en la DB, **incluidas las pasadas** (BUG-32: debe aparecer todo el historial).
- [ ] El id se evalúa **solo contra la DB** (fuente de verdad, BUG-29/33), nunca contra el id en memoria, que puede apuntar a un evento ya borrado.

---

## Refresh automático del token (GC-05)

### Modelo de datos

Tabla `google_tokens` en Supabase:

| Columna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid PK | FK a `auth.users(id)` con `ON DELETE CASCADE` |
| `refresh_token` | text | refresh token de Google (larga vida) |
| `updated_at` | timestamptz | default `now()` |

**RLS (clave de seguridad):** el cliente puede INSERT/UPDATE/DELETE su propia fila, pero **no tiene policy de SELECT** — el refresh token nunca es legible desde la app. Solo la Edge Function (service role) lo lee.

### Edge Function `calendar-token`

1. Valida el JWT del usuario (header `Authorization`).
2. Lee `refresh_token` de `google_tokens` con service role. Sin fila → 404 `no_token`.
3. POST a `https://oauth2.googleapis.com/token` con `client_id`, `client_secret` (secrets de la función), `refresh_token`, `grant_type=refresh_token`.
4. OK → responde `{ access_token, expires_in }`.
5. `invalid_grant` (usuario revocó acceso) → borra la fila y responde 410 `revoked`.
6. Otro error de Google → 502.

Secrets requeridos: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (los mismos del provider Google en Supabase Auth).

### Flujo del cliente

- `conectarCalendar` captura `provider_refresh_token` (hash o `exchangeCodeForSession`) y lo upsertea en `google_tokens`. El access token inicial queda en memoria con su expiración (~55 min).
- `getCalendarAccessToken()` (AuthContext, async): si el token en memoria vence en >60s lo devuelve; si no, invoca `calendar-token` y cachea el nuevo. Si la función responde `revoked`/`no_token` → limpia el flag `google_calendar_connected` y devuelve null.
- `getGoogleToken()` de `AlumnosContext` delega en `getCalendarAccessToken()`.
- `TOKEN_EXPIRADO` (401 de la API de Calendar) invalida el caché en memoria para forzar refresh en la siguiente operación.

---

## Restricciones técnicas

- API directa de Google Calendar REST (no SDK).
- El token se obtiene con `getGoogleToken()` de `AlumnosContext`, que delega en `getCalendarAccessToken()` de `AuthContext` (caché en memoria + refresh vía Edge Function).
- Fallos de Google Calendar nunca bloquean la operación principal (crear/editar/eliminar clase).
- `google_event_id` en Supabase se limpia a `null` cuando el evento es eliminado de Calendar.

---

## Estado actual

- **Implementado:** `crearEvento`, `editarEvento`, `eliminarEvento`, aviso de token vencido (`TOKEN_EXPIRADO` + Alert), recreación de evento al reactivar, detección local de conflictos (GC-06), refresh automático del token vía Edge Function `calendar-token` (GC-05).
- **Despliegue GC-05:** requiere pasos manuales una vez — `supabase link`, `db push`, `secrets set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`, `functions deploy calendar-token`.
