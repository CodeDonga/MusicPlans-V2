# Especificación — Google Calendar

> Estado: **spec reconstruida 2026-06-15** (reemplaza la versión anterior, que
> había quedado parchada con referencias a bugs sueltos). Nivel SDD:
> spec-anchored — el código se audita contra este documento.
>
> Módulos involucrados: `lib/googleCalendar.js`, `context/AuthContext.jsx`,
> `context/AlumnosContext.jsx`, `app/(tabs)/ajustes.jsx`, y la Edge Function
> `supabase/functions/calendar-token`.

---

## 1. Historia de usuario

**Como** profesor de música,
**quiero** que mis clases se reflejen automáticamente en mi Google Calendar,
**para** tener toda mi agenda en un solo lugar sin gestionarla dos veces.

---

## 2. Principios y alcance (decisiones cerradas)

1. **Una sola dirección: app → Calendar.** La app es la fuente de verdad; Calendar es un reflejo. Editar o borrar algo en Google **no** modifica datos en la app. (Pero la app sí recrea lo que se borró en Calendar — ver §6.)
2. **Solo entidades existentes.** Se reflejan únicamente las clases de alumnos/talleres que existen hoy en la app. Las clases de entidades eliminadas (que se conservan como historial financiero) **no** van a Calendar.
3. **Todo el historial.** Se sincronizan las clases pasadas y futuras, mientras no estén canceladas.
4. **Mínima fricción.** Conectar es de una sola vez; reconectar no debe pedir elegir cuenta ni aceptar permisos (ver §3).
5. **No bloqueante.** Ninguna operación de Calendar puede hacer fallar la operación principal (crear/editar/borrar clase nunca se rompe por culpa de Calendar).
6. **Seguridad.** El access token de Google nunca se persiste en el cliente (vive solo en memoria). El refresh token vive server-side y es ilegible desde el cliente.

---

## 3. Conexión y desconexión

### Conectar (desde Ajustes)
- [ ] **Verificar primero:** al tocar "Conectar", la app intenta obtener un access token usando el refresh token guardado. Si lo logra, queda **conectada sin abrir Google** (sin selector de cuenta ni consentimiento).
- [ ] **Si no hay token utilizable**, abre el flujo OAuth con: scope `calendar.events`, `access_type=offline`, `login_hint`=email del usuario (preselecciona la cuenta, salta el selector) y `prompt=consent`. **Se fuerza `prompt=consent` en este fallback** (BUG-38): el flujo OAuth solo se abre cuando no hay refresh token utilizable (primer connect o tras revocar el acceso en Google), y con el scope ya concedido Google **no** reemite `provider_refresh_token` salvo que se pida consentimiento — sin esto, reconectar tras una revocación no recupera el refresh token y la sync muere al expirar el access token (~55 min). No agrega fricción al reconnect normal: ese caso lo resuelve el verify-first sin abrir Google.
- [ ] Al conectar con éxito: se guarda el refresh token (server-side, §4), se marca `google_calendar_connected=true` y se dispara una **sincronización completa** (§5).

### Desconectar
- [ ] Limpia el flag `google_calendar_connected` y el token en memoria. La app deja de sincronizar.
- [ ] **Conserva** la fila de `google_tokens` a propósito, para que reconectar sea instantáneo.
- [ ] Revocar de verdad el acceso se hace desde la cuenta de Google. Si el refresh token quedara inválido (revocado), la Edge Function lo borra sola.

### Login con Google (a la app)
- [ ] No fuerza selección de cuenta. La sesión de Supabase se persiste (`persistSession`), así que el login es de una sola vez.

---

## 4. Modelo de datos y refresh del token

### Tabla `google_tokens`
| Columna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid PK | FK a `auth.users(id)` ON DELETE CASCADE |
| `refresh_token` | text | refresh token de Google (larga vida) |
| `updated_at` | timestamptz | default `now()` |

- **RLS:** el cliente puede INSERT/UPDATE/DELETE su propia fila, pero **no hay policy de SELECT** → el refresh token nunca es legible desde la app (un `select` como `authenticated` devuelve 0 filas).
- **Grant:** `authenticated` tiene `SELECT` a nivel de tabla (lo exige el upsert `ON CONFLICT`), pero RLS lo neutraliza para lectura. El refresh token sigue protegido.
- **Escritura del token:** `conectarCalendar` hace **`upsert`** idempotente (`onConflict: user_id`). Nunca delete+insert.

### `clases.google_event_id`
- Guarda el id del evento de Google para esa clase. `null` = sin evento.
- **Fuente de verdad del id: la DB**, no el estado en memoria (que puede tener un id viejo).

### Edge Function `calendar-token` (refresh, GC-05)
1. Valida el JWT del usuario.
2. Lee `refresh_token` de `google_tokens` con service role. Sin fila -> 404 `no_token`.
3. POST a `https://oauth2.googleapis.com/token` con `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (secrets de la función) + el refresh token. **Estos secrets deben ser exactamente el mismo cliente OAuth que usa Supabase Auth para Google** (si no, Google responde `invalid_client` y nada sincroniza — fue la causa raíz de BUG-31).
4. OK -> `{ access_token, expires_in }`.
5. `invalid_grant` -> borra la fila y responde 410 `revoked`.

### Cliente
- `getCalendarAccessToken()` (AuthContext): si el token en memoria vence en >60s lo devuelve; si no, invoca `calendar-token` y cachea el nuevo. Si responde `revoked`/`no_token` -> limpia el flag y devuelve null.
- `TOKEN_EXPIRADO` (401 de la API) invalida el caché en memoria; la próxima operación refresca sola.

---

## 5. Sincronización

### Cuándo corre
- [ ] Al **conectar** Calendar.
- [ ] **Automáticamente al abrir la app** (y al volver a foreground) si Calendar está conectado.
- [ ] Con un botón **"Sincronizar ahora"** en Ajustes, que informa el resultado (p. ej. "7 clases sincronizadas").
- [ ] Además, cada operación individual sobre una clase actualiza su evento en el momento (§6).

### Qué hace (reconciliación)
Recorre las clases de los alumnos/talleres **existentes**. Para cada una:
- [ ] Estado **cancelada** -> no debe haber evento: si lo hay, se elimina y se limpia el id.
- [ ] Estado **pendiente / realizada / reagendada** -> debe haber un evento al día:
  - sin evento -> se **crea** y se guarda el id.
  - con evento que **ya no existe** en Calendar (borrado a mano) -> se **recrea**.
  - con evento existente -> se **actualiza** su contenido (fecha/hora/título/descripción).
- [ ] **Robustez:** cada evento se etiqueta con el id de la clase en `extendedProperties.private.mp_clase_id`. La reconciliación se hace por esa etiqueta (listando los eventos de la app una sola vez con `events.list`), de modo que la sincronización se autocorrige aunque el `google_event_id` guardado se haya perdido o desincronizado.
- [ ] Eficiencia: una llamada `events.list` por sincronización + solo las escrituras necesarias (crear/actualizar/borrar). No se hace una llamada por clase a ciegas.

---

## 6. Ciclo de vida del evento según el estado de la clase

| Acción en la app | Estado resultante | Efecto en Calendar |
|---|---|---|
| Crear clase | pendiente / realizada | Se **crea** el evento |
| Marcar pagada | realizada | El evento se **mantiene** |
| Marcar no pagada | pendiente | El evento se **mantiene** |
| Reagendar (cambia fecha/hora) | reagendada | El evento se **actualiza** (nueva fecha/hora) |
| Editar (planificación/tarea/valor) | sin cambio | El evento se **actualiza** |
| Cancelar clase | cancelada | El evento se **elimina** y se limpia el id |
| Reactivar una clase cancelada | pendiente / realizada | El evento se **recrea** |
| Borrar clase | — | El evento se **elimina** |
| Borrar el evento a mano en Calendar | (cualquiera no cancelada) | La próxima sincronización lo **recrea** (el dato persiste en la app) |
| Eliminar alumno/taller | — | Se eliminan **todos** sus eventos, incluidos los de clases pagadas que se conservan como historial financiero |

---

## 7. Mapeo clase -> evento

- **Título:** `🎵 Clase: {nombre del alumno o taller}` (el nombre se toma de la entidad vigente).
- **Descripción:** planificación (`📋 Planificación:`) y tarea (`✅ Tarea:`) si existen.
- **Inicio:** fecha + hora de la clase, en la zona horaria local del dispositivo.
- **Duración:** 1 hora.
- **Etiqueta:** `extendedProperties.private.mp_clase_id = {id de la clase}`.

---

## 8. Casos borde

| Caso | Comportamiento |
|---|---|
| Sin token / sin conexión al crear una clase | La clase se crea igual; el evento se crea en la próxima sincronización. |
| Token vencido a mitad de una sincronización | Se refresca y se continúa; no se aborta el resto. |
| Evento borrado a mano en Calendar | Se recrea en la próxima sincronización (clase no cancelada). |
| Clase de un alumno eliminado | No se sincroniza (no tiene entidad vigente). |
| Reconexión tras desconectar | Instantánea: reutiliza el refresh token guardado, sin pasar por Google. |
| `invalid_client` al refrescar | Falla de configuración de secrets de la Edge Function, no de la app (ver §4). |

---

## 9. Restricciones técnicas

- API REST de Google Calendar directa (sin SDK).
- Calendario `primary` del usuario.
- Scope `calendar.events` (permite crear/leer/editar/borrar eventos y `events.list`; no permite listar calendarios, lo cual no se necesita).
- Fallos de Calendar nunca bloquean la operación principal; se loguean (en dev a consola; en prod a `error_logs`).
- `google_event_id` se limpia a `null` cuando el evento se elimina.

---

## 10. Estado del código vs. esta spec (a auditar)

> **Paso 1 — Consolidación (hecho 2026-06-15).** La lógica de "reflejar una clase en Calendar", antes duplicada en 5 lugares, se unificó en una sola función `reflejarClaseEnCalendar(entidadId, clase, entidad)` (núcleo puro `aplicarEventoDeClase`). La usan `agregarClase`, `editarClase` y `cambiarEstadoClase`. Mapeo de estados §6 verificado contra el código. Manejo de token unificado (`safeGCal`).
>
> **Code-review + correcciones (2026-06-16, BUG-37..46).** `sincronizarClasesExistentes` ahora también enruta por `aplicarEventoDeClase` (unifica el manejo de error vía `safeGCal` y **borra los eventos de clases canceladas** con id — antes las salteaba, dejando huérfanos; BUG-39/44). Robustez añadida: el branch `cancelada` de `aplicarEventoDeClase` **no limpia el id si el DELETE falla** (BUG-40); toda operación de Calendar se **gatea con el flag de conexión** antes de invocar la Edge Function (BUG-41); la cancelación en `cambiarEstadoClase` ya no depende del objeto en memoria (BUG-42); y el fallback OAuth fuerza `prompt=consent` (BUG-38, §3).
>
> Brechas que faltan cerrar:
> - **GC-09 (parcial):** falta etiquetar eventos con `mp_clase_id` + reconciliación por `events.list` (hoy la sync sigue leyendo el id por lote de la DB y verificando con PATCH por clase, pero ya borra canceladas y reusa el núcleo). El etiquetado para re-adoptar eventos huérfanos sin id sigue pendiente.
> - **GC-10:** sincronizar al abrir la app / foreground (hoy solo al conectar).
> - **GC-11:** botón "Sincronizar ahora" en Ajustes.
