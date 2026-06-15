# Backlog de Tareas — MusicPlans
> Tareas atómicas y verificables. Cada tarea tiene un criterio de aceptación claro.  
> Estado: ✅ Hecho | 🔄 En progreso | ⬜ Pendiente | 🚫 Bloqueado | ⏸️ Pospuesto (futuro)
>
> **Bugs conocidos:** sin pendientes. BUG-20..28, ARQ-07..09 corregidos el 2026-06-11; BUG-29 corregido y verificado en dispositivo el 2026-06-12; BUG-30 (privilegios de DB) corregido el 2026-06-13; BUG-31 (refresco de Calendar roto por `invalid_client` — config de secrets, **causa raíz del "Calendar no funciona"**), BUG-32 (sync salta clases pasadas) y BUG-33 (eventos borrados no se recrean) corregidos y verificados contra Google el 2026-06-15.

---

## Deuda técnica y arquitectura

| # | Tarea | Estado | Descripción |
|---|---|---|---|
| ARQ-01 | Corregir orden de providers en `_layout.jsx` | ✅ | `AuthProvider` debe envolver a `AlumnosProvider`, no al revés |
| ARQ-02 | Doble listener `onAuthStateChange` en `AlumnosContext` | ✅ | Eliminado — ahora consume `useAuth()` directamente |
| BUG-01 | `paleta.onPrimary` no existe — texto invisible en Ajustes | ✅ | `ajustes.jsx:97,195` — botón "Guardar cambios" tiene color undefined |
| BUG-02 | `router.push('/finanzas')` apila pantalla en lugar de navegar al tab | ✅ | `agenda.jsx:289` — cambiar a `router.navigate('/(tabs)/finanzas')` |
| BUG-03 | `solicitarPermisos()` no se llama si la app se reabre con sesión activa | ✅ | `_layout.jsx` — movido a useEffect separado que corre siempre que session sea truthy |
| BUG-15 | Notificaciones de inicio de clase no llegan | ✅ | Corregido |
| BUG-04 | Badge "En Curso" nunca se muestra (ventana 0 segundos) | ✅ | `agenda.jsx:95` — comparación `getHours()` exacto, necesita rango de 60 min |
| BUG-14 | Badge "En Curso" tarda hasta 60s en aparecer | ✅ | `agenda.jsx` — reemplazado intervalo por timeout exacto al próximo cambio de estado |
| BUG-05 | `hoy` en Agenda queda obsoleto tras medianoche | ✅ | `agenda.jsx:19` — `useMemo` sin deps, reemplazar con `new Date()` directo |
| BUG-06 | `useAuth()` sin guard fuera del provider | ✅ | Agregado guard con error informativo |
| BUG-07 | Token Calendar de corta vida guardado en metadata | ✅ | Eliminado fallback a metadata; usa solo `session.provider_token`. ⚠️ Reintroducido después — ver BUG-21 |
| BUG-08 | Al reactivar clase cancelada no se re-programa notificación | ✅ | `AlumnosContext:cambiarEstadoClase` — captura `estadoPrevio` y re-programa cuando viene de `cancelada` |
| BUG-09 | PanResponder en Finanzas bloquea scroll del FlatList | ✅ | `finanzas.jsx` — alineado con patrón de agenda.jsx: `onStartShouldSetPanResponder: false` + `onMoveShouldSetPanResponder` activa solo en horizontal |
| BUG-10 | `parseFecha` no valida rangos — overflow silencioso | ✅ | `lib/fechas.js` — añadidas validaciones de rango (mes 1-12, día 1-31, año 1900-9999) y roundtrip check para rechazar fechas inválidas como 30/02 |
| BUG-11 | Zona horaria hardcodeada a `America/Santiago` | ✅ | `lib/googleCalendar.js` — usa `Intl.DateTimeFormat().resolvedOptions().timeZone` vía `getLocalTimeZone()` |
| BUG-12 | Errores de carga en Supabase vacían la UI silenciosamente | ✅ | `AlumnosContext:cargarDatos` — ahora verifica errores antes de setear estado |
| BUG-13 | `agregarAlumno` falla silenciosamente | ✅ | Retorna `{ error }` y `nuevo-alumno.jsx` muestra Alert |
| ARQ-03 | `makeStyles(paleta)` recalcula StyleSheet en cada render | ✅ | Envuelto en `useMemo(() => makeStyles(paleta), [paleta])` en los 9 archivos que lo usan; movido antes de cualquier early return para cumplir Rules of Hooks |
| ARQ-04 | Participantes de taller guardan objeto completo | ✅ | `AlumnosContext`: `tallerToDB` ahora persiste solo IDs (`extraerIds`); `dbToTaller` hidrata `{id, nombre}` desde `alumnos` al cargar. Mantiene compatibilidad de lectura con registros antiguos (objetos) |
| ARQ-05 | Eliminación optimista sin rollback completo | ✅ | `AlumnosContext`: las 3 funciones de eliminación (alumno, taller, clase) ahora corren Supabase primero; estado y side effects (notificación, gCal) solo se aplican tras éxito remoto |
| ARQ-06 | `SafeAreaView` de `react-native` deprecado en 8 archivos | ✅ | Reemplazar por `react-native-safe-area-context` en todos los archivos |
| BUG-16 | Queries Supabase sin filtro `user_id` explícito | ✅ | `AlumnosContext:cargarDatos` ahora añade `.eq('user_id', userId)` en las 3 queries (alumnos, talleres, clases) — defensa-en-profundidad sobre RLS |
| BUG-17 | Fallo silencioso al editar/eliminar evento en Google Calendar | ✅ | `lib/googleCalendar.js` — `editarEvento`/`eliminarEvento` detectan 401 y lanzan `TOKEN_EXPIRADO`; `AlumnosContext` los envuelve en helper `safeGCal` que avisa al usuario y limpia el token |
| BUG-18 | `perfil.jsx` no resincroniza estados de edición al cambiar entidad | ✅ | Split: `Perfil` wrapper extrae `id`/`tipo` y renderiza `<PerfilContent key={tipo-id} ... />`. Al cambiar de entidad React desmonta y reinicia todos los estados internos |
| BUG-19 | `hoy` en agenda.jsx aún memoizado sin deps (BUG-05 incompleto) | ✅ | `agenda.jsx:20` — reemplazado por `const hoy = new Date()` (sin useMemo); ahora se reevalúa en cada render y sigue al cambio de día |
| BUG-20 | Cerrar sesión sin confirmación (regresión de AJ-07) | ✅ | `ajustes.jsx` — el botón ahora muestra Alert de confirmación (Cancelar / Cerrar sesión) antes de `signOut` |
| BUG-21 | Token Calendar de corta vida en metadata (regresión de BUG-07) | ✅ | `getGoogleToken()` usa solo `session.provider_token`; `conectarCalendar` ya no guarda el token en metadata; eliminadas las limpiezas de `google_provider_token` |
| BUG-22 | Eliminar alumno/taller deja notificaciones y eventos gCal huérfanos | ✅ | `AlumnosContext:limpiarClasesBorradas` — cancela notificaciones y borra eventos gCal de las clases eliminadas (las pagadas conservan su evento como histórico) |
| BUG-23 | Reactivar clase cancelada no recrea el evento de Google Calendar | ✅ | `AlumnosContext:recrearEventoGCal` — `cambiarEstadoClase` y `editarClase` crean el evento cuando la clase reactivada no tiene `googleEventId`, y persisten el nuevo id |
| BUG-24 | `shouldShowAlert` deprecado en expo-notifications SDK 54 | ✅ | `lib/notificaciones.js` — handler usa `shouldShowBanner` + `shouldShowList` según doc v54 |
| BUG-25 | `channelId` en `content` en vez de `trigger` | ✅ | `lib/notificaciones.js` — `channelId: 'clases'` movido al trigger (doc v54); el canal HIGH + sonido ahora aplica en Android |
| BUG-26 | Subtítulo del calendario dice "hoy" pero cuenta el día seleccionado | ✅ | `agenda.jsx` — nuevo `clasesDeHoy` (filtra por `isSameDay(hoy)`); singular/plural corregido |
| BUG-27 | Estado `reagendada` se muestra como "Pendiente" en la agenda | ✅ | `agenda.jsx:getEstadoInfo` — caso `reagendada` con `paleta.warning` |
| ARQ-07 | Colores hardcodeados fuera de la paleta | ✅ | `#ef4444` → `paleta.alert` (login/registro), `#F59E0B` → `paleta.warning` (perfil), `COLOR_HOY` → `paleta.onSurface` y fallbacks eliminados (agenda) |
| ARQ-08 | `console.error` en producción | ✅ | Eliminado de `agregarTaller`; el error ya se propaga vía `{ error }` y Alert en `nuevo-taller.jsx` |
| ARQ-09 | Paleta `secondary` oscuro difiere de la constitución | ✅ | Resuelto 2026-06-11: se actualizó la constitución a `#7C3AED` (decisión del usuario — `#4C1D95` sobre `#001230` da contraste ~1.6:1, ilegible como texto). El código ya estaba correcto |
| BUG-29 | Borrar una clase no elimina su evento de Google Calendar | ✅ | Corregido 2026-06-12. Causa raíz: cadena de fallos silenciosos — el UPDATE que persiste `google_event_id` no chequeaba error, y al recargar datos (AppState active) el estado en memoria perdía el id, así que el borrado saltaba la llamada a gCal. Fix: (1) el `google_event_id` se lee de la DB (fuente de verdad) antes de eliminar/cancelar clase y al eliminar alumno/taller (`eventoIdDesdeDB`/`conEventosDeDB`); (2) `eliminarEvento` devuelve éxito/fallo según status real (404/410 = ya no existe) y loguea en `__DEV__`; (3) `persistirEventoId` chequea el error del UPDATE; (4) anti-duplicados: `editarClase`/reactivación/`sincronizarClasesExistentes` consultan la DB antes de crear un evento nuevo. Verificado en dispositivo el 2026-06-12 |
| BUG-28 | `conectarCalendar` pierde el `provider_token` en el flujo de hash — Calendar nunca sincroniza | ✅ | `AuthContext.jsx:128-131` — `setSession({access_token, refresh_token})` no acepta `provider_token`, así que `getGoogleToken()` siempre lee null. La conexión "parece exitosa" (flag + Alert) pero crear/sincronizar eventos falla en silencio. Fix: guardar el token en un ref en memoria (nunca persistido, conforme BUG-07/BUG-21) y usarlo como fallback en `getGoogleToken()`; limpiarlo en signOut/desconectar/TOKEN_EXPIRADO |
| BUG-31 | Refresco del token de Calendar roto: Google responde `invalid_client` | ✅ | **Causa raíz real del "Calendar no funciona".** Detectado 2026-06-15 verificando contra Google de verdad (cadena sesión temporal → Edge Function `calendar-token` → API de Google). La función devolvía `502 {"error":"google_error","detail":"invalid_client"}`: los secrets `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` de la Edge Function **no coincidían** con el cliente OAuth que Supabase Auth usa para el login Google (`531381715074-…`, el que emite el `provider_refresh_token`). Consecuencia: al expirar el token en memoria (~55 min) o reabrir la app, el refresco fallaba → `getCalendarAccessToken` devolvía null → ninguna operación de Calendar funcionaba, en silencio. **No es bug de código** (por eso BUG-22/23/28/29 no lo resolvían) sino de configuración de secrets. Fix: el usuario seteó `GOOGLE_CLIENT_SECRET` correcto (cliente nuevo) en los secrets de Edge Functions. Verificado 2026-06-15: la función ahora devuelve access token válido y `events.list` responde con scope `calendar.events`. Verificador reutilizable en `scripts/verificar-calendar.ps1`. |
| BUG-32 | La sincronización salta las clases pasadas | ✅ | `sincronizarClasesExistentes` (`AlumnosContext.jsx`) descartaba toda clase con `fecha < hoy`, así que el historial nunca aparecía en Calendar y, una vez que una clase quedaba en el pasado, jamás obtenía evento. Decisión de producto 2026-06-15: **debe aparecer todo**. Fix: quitar el filtro de fecha (se siguen saltando solo las canceladas y las de fecha inválida). |
| BUG-33 | Un evento borrado en Calendar no se recrea al **editar** la clase | ✅ | Si el usuario borra el evento en Google, `editarEvento` hacía PATCH sobre un evento inexistente (404 ignorado). Fix: `editarEvento` devuelve `'gone'` ante 404/410 y `editarClase` recrea el evento; corrección de datos una vez (2026-06-15): limpiados 9 `google_event_id` que apuntaban a eventos ya borrados. |
| BUG-34 | Al reconectar, la sincronización NO recrea eventos borrados que aún tienen id guardado | ✅ | Reportado 2026-06-15: el usuario sincronizó las 18 clases OK, las borró a mano en Calendar, desconectó/reconectó y **no volvieron**. Causa: `sincronizarClasesExistentes` saltaba toda clase con `google_event_id` en la DB sin verificar que el evento siguiera existiendo en Google; y desconectar **no** limpia los ids (solo borra el token), así que el id quedaba para siempre. Fix: la sincronización ahora, para cada clase con id, llama a `editarEvento` (PATCH) — si devuelve `'gone'` (404/410) **recrea** el evento; si existe, lo actualiza y sigue. Así reconectar reconcilia el estado real de Calendar (y mantiene el contenido al día). No se limpian ids en desconexión a propósito: evita duplicar eventos que sí siguen existiendo. |
| BUG-35 | `conectarCalendar` no guarda el nuevo refresh token al reconectar | ✅ | Reportado 2026-06-15 (logs del dispositivo). Dos capas: **(1)** `conectarCalendar` hacía `delete`+`insert`; el `delete` fallaba **en silencio** (su error no se chequeaba) y el `insert` daba `duplicate key` sobre la PK `user_id` → el nuevo refresh token no se persistía. **(2) Causa de fondo:** el rol `authenticated` **no tenía SELECT** sobre `google_tokens` (por diseño, refresh token ilegible), pero toda escritura dirigida a la propia fila lo necesita: `DELETE/UPDATE ... WHERE user_id` lee `user_id`, y el `upsert` (`INSERT ... ON CONFLICT DO UPDATE`) exige **SELECT a nivel de tabla** (Postgres `42501`, lo confirmó el HINT). Por eso al pasar a upsert el error mutó a `permission denied for table`. Fix: **(a)** código → `upsert` idempotente (`onConflict: 'user_id'`, `updated_at`); **(b)** migración `20260615120000_google_tokens_select_grant.sql` → `grant select on public.google_tokens to authenticated`. **Seguridad preservada:** RLS no tiene policy de SELECT, así que un `select` como `authenticated` devuelve **0 filas** (verificado en prueba con `set local role authenticated`); el grant solo habilita el chequeo interno de privilegios del upsert, no expone el `refresh_token`. Aplicada y registrada en prod 2026-06-15. |

### Robustez previa al módulo de pagos (evaluación 2026-06-12)

> Hallazgos de la auditoría completa de la app. ARQ-10..13 son **bloqueantes** antes de PF-01; el resto, muy recomendados.
>
> **Estado 2026-06-13:** resuelta toda la deuda no atada a pagos → ARQ-10 ✅, BUG-30 ✅, ARQ-13 🔄 (infra + tests de fechas listos; falta la máquina de estados de pagos), ARQ-14 ✅, ARQ-15 ✅, ARQ-16 ✅, ARQ-17 ✅. **Quedan para la fase de pagos:** ARQ-11 (bloquear `clases.pagada` en DB — rompería el toggle manual actual hasta que exista PF) y ARQ-12 (spec Flow→Khipu).

| # | Tarea | Estado | Descripción |
|---|---|---|---|
| ARQ-10 | Versionar el esquema de la DB como baseline | ✅ | **Bloqueante.** Hecho 2026-06-12 vía Management API (Docker no disponible para `db pull`): migración `20260601000000_baseline.sql` con `alumnos`/`talleres`/`clases` + RLS + policies (idempotente). Auditoría RLS: ✅ RLS activo en las 4 tablas, policies correctas (`auth.uid() = user_id`; `google_tokens` sin SELECT). Cerrado 2026-06-13: baseline aplicado y **registrado en el historial remoto** (`schema_migrations`: baseline + google_tokens + fix_grants). Runner reutilizable `scripts/db-exec.ps1` (aplica/registra vía Management API). |
| BUG-30 | Privilegios de DB rotos: GC-05 nunca funcionó (google_tokens vacía) | ✅ | Cerrado 2026-06-13: migración `20260612100000_fix_grants.sql` aplicada y registrada en prod. Verificado: `authenticated` con INSERT/UPDATE/DELETE en `google_tokens` (sin SELECT, RLS), `service_role` con SELECT en todas las tablas, `anon` sin TRUNCATE. `conectarCalendar` ahora chequea el error del insert (avisa en `__DEV__`). Detectado en auditoría ARQ-10. (1) `authenticated` sin INSERT/UPDATE/DELETE en `google_tokens` → el insert del refresh token en `conectarCalendar` (AuthContext:148-149, error ignorado) falla en silencio desde el día uno: la tabla tiene **0 filas** y el refresh automático jamás operó — Calendar vive del token en memoria (~55 min) y se "desconecta solo". (2) `service_role` sin SELECT en ninguna tabla pública → `calendar-token` no podría leer el token aunque existiera, y las Edge Functions de pagos no podrán leer `clases`. (3) TRUNCATE concedido a `anon`/`authenticated` (no respeta RLS). (4) Default privileges alterados: tablas futuras nacen sin permisos útiles. Fix: migración `20260612100000_fix_grants.sql` + chequear el error del insert en `conectarCalendar` |
| ARQ-11 | Bloquear en DB la escritura cliente de `clases.pagada` | ⏸️ | **Pospuesto** (2026-06-13): con cobro manual el toggle `pagada` es legítimamente editable por el profesor (es la fuente de verdad del pago en v1). Vuelve a tener sentido solo si se implementa la pasarela. |
| ARQ-12 | Actualizar spec de pagos: Flow → Khipu | ⏸️ | **Investigado y pospuesto** (2026-06-13): Khipu v3 cubre crear/consultar/webhook firmado/anular/reembolsar (refund solo antes del settlement 24–72h), comisión ~0,69–1,5%, solo transferencia. Hallazgos guardados en `cobro-transferencia.md` §Mejora futura. La v1 usa cobro manual asistido, así que la pasarela queda para más adelante. |
| ARQ-13 | Infraestructura de tests (jest-expo) | 🔄 | **Bloqueante.** Infra lista 2026-06-13: `jest-expo@54` + `jest@29` (instalados con `--legacy-peer-deps` por conflicto preexistente react/react-dom), preset + `transformIgnorePatterns` en `package.json`, scripts `test`/`test:watch`. Primeros tests: `lib/__tests__/fechas.test.js` (23 casos, incluye roundtrip de BUG-10). **Pendiente:** tests de la máquina de estados de pagos — se escriben junto con la spec (ARQ-12) antes de implementar PF. |
| ARQ-14 | Observabilidad: Sentry o logging estructurado | ✅ | Cerrado 2026-06-13: **logging estructurado propio** (no Sentry — requería cuenta + rebuild de APK, decisión a revisar con el usuario). Tabla `error_logs` (RLS por `user_id`, migración `20260613100000`) + helper `lib/log.js` (`logWarn`/`logError`): en dev a consola, en prod persiste en Supabase. Instrumentados los puntos de DB/gCal/notificaciones en `AlumnosContext`, `AuthContext`, `notificaciones.js`, `googleCalendar.js` (reemplazan los `__DEV__ console.warn`). Mejora futura abierta: añadir Sentry encima para crashes nativos. |
| ARQ-15 | Guard en `cargarDatos()` del AppState listener | ✅ | Cerrado 2026-06-13: contador `mutacionesEnCurso` (ref) que envuelve los 12 mutadores vía `conGuard`; el listener de AppState solo recarga al volver a foreground si `mutacionesEnCurso.current === 0`. Evita pisar estado optimista (familia BUG-29) y cubre el flujo de pagos "generar link → WhatsApp → volver". |
| ARQ-16 | Errores silenciosos restantes | ✅ | Cerrado 2026-06-13: helper `borrarClasesNoPagadas` chequea el error de ambos deletes en `eliminarAlumno`/`eliminarTaller` y aborta (cargarDatos + return) para no dejar clases huérfanas; los `catch (_) {}` de `notificaciones.js` ahora loguean en `__DEV__`. |
| ARQ-17 | Validación de montos en DB | ✅ | Cerrado 2026-06-13: migración `20260613000000_check_montos.sql` (aplicada + registrada). CHECK `>= 0 and <= 10000000` en `alumnos.valor_clase`, `talleres.valor_por_alumno`, `clases.valor_unitario` y `clases.valor_custom` (este último permite null). Se usa `>= 0` (no `> 0`) porque un valor 0 es válido (clase de cortesía / sin definir) y existe en datos reales. |

---

## Módulo: Autenticación

| # | Tarea | Estado | Spec |
|---|---|---|---|
| A-01 | Login email/contraseña funcional | ✅ | autenticacion.md |
| A-02 | Login con Google OAuth | ✅ | autenticacion.md |
| A-03 | Registro de nueva cuenta | ✅ | autenticacion.md |
| A-04 | Persistencia de sesión entre aperturas | ✅ | autenticacion.md |
| A-05 | Logout limpia todos los estados de contexto | ✅ | autenticacion.md |
| A-06 | Validaciones inline en formularios (sin Alert) | ✅ | autenticacion.md — login y registro muestran errores inline (`setError` + texto bajo el formulario) |
| A-07 | Flujo "Olvidaste tu contraseña?" | ✅ | autenticacion.md — `resetPasswordForEmail` desde login (mensaje inline), deep link `type=recovery` en AuthContext, pantalla `nueva-contrasena.jsx`, AuthGate enruta durante recuperación. Pendiente probar en dispositivo |

---

## Módulo: Alumnos

| # | Tarea | Estado | Spec |
|---|---|---|---|
| AL-01 | Lista de alumnos con tarjetas | ✅ | alumnos.md |
| AL-02 | Estado vacío en lista | ✅ | alumnos.md |
| AL-03 | FAB con opciones alumno/taller | ✅ | alumnos.md |
| AL-04 | Formulario agregar alumno | ✅ | alumnos.md |
| AL-05 | Validaciones campos obligatorios en nuevo alumno | ✅ | alumnos.md — `nuevo-alumno.jsx:validar()`: nombre, instrumento, whatsapp y valor con errores inline por campo |
| AL-06 | Perfil del alumno | ✅ | alumnos.md |
| AL-07 | Modal editar alumno | ✅ | alumnos.md |
| AL-08 | Eliminar alumno con confirmación | ✅ | alumnos.md |
| AL-09 | Registro de clases en perfil | ✅ | alumnos.md |
| AL-10 | Agregar clase con fecha/hora/planif/tarea | ✅ | alumnos.md — default a próxima fecha/hora habitual |
| AL-11 | Editar clase (modal) | ✅ | alumnos.md |
| AL-12 | Eliminar clase con confirmación | ✅ | alumnos.md |
| AL-13 | Badge de estado presionable (selector 4 estados: + Reagendada) | ✅ | alumnos.md |
| AL-14 | Toggle pagada/no pagada por clase | ✅ | alumnos.md |
| AL-15 | Reagendada: al seleccionar abre modal de edición automáticamente | ✅ | alumnos.md |
| AL-16 | Valor personalizado por clase (override del valor por defecto) | ✅ | alumnos.md |
| AL-17 | Toggle pagada con simetría: pagada=true → 'realizada' (cancela notif); pagada=false → 'pendiente' (re-programa notif) | ✅ | `AlumnosContext:togglePagadaClase` — simétrico. Solo se modifica `estado` cuando va de no-realizada→realizada o de realizada→pendiente. Cancelada/reagendada no se tocan |
| AL-18 | ~~DEPRECAR AL-14 y AL-17~~ | ⏸️ | **Cancelado en v1** (2026-06-13): con cobro manual asistido el toggle de `pagada` se **mantiene** como fuente de verdad del pago. Solo reviviría con la pasarela automática. |

---

## Módulo: Talleres

| # | Tarea | Estado | Spec |
|---|---|---|---|
| T-01 | Formulario agregar taller | ✅ | talleres.md |
| T-02 | Lista de talleres integrada con alumnos | ✅ | talleres.md |
| T-03 | Perfil del taller (reutiliza perfil alumno) | ✅ | talleres.md |
| T-04 | Cálculo de valor por clase (por_alumno × participantes) | ✅ | talleres.md |
| T-05 | Búsqueda/selección de alumnos existentes como participantes | ✅ | talleres.md — lista seleccionable en `nuevo-taller.jsx:192-210` y en modal de edición de `perfil.jsx:488-510` |

---

## Módulo: Agenda

| # | Tarea | Estado | Spec |
|---|---|---|---|
| AG-01 | Lista de próximas sesiones ordenada | ✅ | agenda.md |
| AG-02 | Navegación a perfil desde sesión | ✅ | agenda.md |
| AG-03 | Agrupación por fecha con encabezado de día | ✅ | agenda.md — satisfecha por el rediseño calendario: el timeline muestra un día con encabezado "Agenda: {Día} {N}". Spec actualizada al diseño vigente |
| AG-04 | Estado vacío con mensaje | ✅ | agenda.md — "Sin clases este día" en el timeline del día seleccionado |

---

## Módulo: Finanzas

| # | Tarea | Estado | Spec |
|---|---|---|---|
| F-01 | Resumen del mes (totales) | ✅ | finanzas.md |
| F-02 | Lista de alumnos/talleres con estado de pago | ✅ | finanzas.md |
| F-03 | Detalle expandible por alumno (toggle pagada + atajo Generar cobro) | ⬜ | finanzas.md — el detalle mantiene el toggle de pagada y suma el atajo "Generar cobro" (CT-06). |
| F-04 | Selector de mes | ✅ | finanzas.md — flechas + swipe horizontal en `finanzas.jsx:95-103` |
| F-05 | Sección histórico de eliminados | ✅ | finanzas.md — footer "Pagos históricos" en `finanzas.jsx:150-181` |
| F-06 | Badge "Esperando pago" cuando existe pago `pendiente` para el alumno | ⏸️ | **Pospuesto** (2026-06-13): el cobro manual de v1 no persiste estado de "cobro enviado", así que no hay de dónde derivar el badge. Vuelve con la pasarela. |

---

## Módulo: Ajustes

| # | Tarea | Estado | Spec |
|---|---|---|---|
| AJ-01 | Selector tema oscuro/claro | ✅ | ajustes.md |
| AJ-02 | Mostrar perfil del profesor (nombre + email) | ✅ | ajustes.md |
| AJ-03 | Editar nombre del profesor | ✅ | ajustes.md — `ajustes.jsx:handleGuardarPerfil` con validación y feedback |
| AJ-04 | Estado de conexión Google Calendar | ✅ | ajustes.md |
| AJ-05 | Botón desconectar Google Calendar | ✅ | ajustes.md |
| AJ-06 | Sección suscripción (estado + botón renovar) | ⬜ | ajustes.md |
| AJ-07 | Cerrar sesión con confirmación | ✅ | ajustes.md — regresión corregida vía BUG-20 (Alert de confirmación) |

---

## Módulo: Notificaciones

| # | Tarea | Estado | Spec |
|---|---|---|---|
| N-01 | Programar notificación al crear clase | ✅ | notificaciones.md |
| N-02 | Cancelar notificación al eliminar/cancelar clase | ✅ | notificaciones.md |
| N-03 | Reprogramar notificación al editar clase | ✅ | notificaciones.md |
| N-04 | Solicitar permisos al primer uso | ✅ | notificaciones.md — `_layout.jsx:19-21` llama `solicitarPermisos()` al haber sesión; el OS muestra diálogo una sola vez |
| N-05 | No programar si la clase está en el pasado | ✅ | notificaciones.md — guard `fechaNotif <= now` en `programarNotificacion` |

---

## Módulo: Google Calendar

| # | Tarea | Estado | Spec |
|---|---|---|---|
| GC-01 | Conectar Calendar desde Ajustes (OAuth) | ✅ | google-calendar.md |
| GC-02 | Crear evento al agregar clase (incluye planificación y tarea) | ✅ | google-calendar.md |
| GC-03 | Editar evento al editar clase (incluye planificación y tarea) | ✅ | google-calendar.md |
| GC-04 | Eliminar evento al cancelar/eliminar clase | ✅ | google-calendar.md |
| GC-05 | Refresh automático del token vía Edge Function | ✅ | google-calendar.md § Refresh automático — tabla `google_tokens` (RLS sin SELECT) + función `calendar-token` + cliente con caché en memoria. Desplegado y verificado en dispositivo el 2026-06-11: las clases sincronizan tras cerrar/reabrir la app sin reconectar |
| GC-06 | Detección de conflictos de horario | ✅ | google-calendar.md — detección local en `perfil.jsx:buscarConflicto`: solapamiento de ventanas de 60 min entre clases no canceladas, Alert "¿Guardar igual?" al crear y al editar. freeBusy de Google queda como mejora futura |
| GC-08 | Conectar/loguear con mínima fricción (sin elegir cuenta ni aceptar cada vez) | ✅ | Pedido del usuario 2026-06-15: cansaba el "elegir cuenta → continuar → aceptar". Fix en `AuthContext`: (1) `conectarCalendar` **verifica primero** un refresh token utilizable (`getCalendarAccessToken`) y si existe queda conectado **sin abrir Google**; (2) cuando sí abre OAuth, usa `login_hint`=email (salta el selector) y **sin** `prompt:consent`; (3) `signInWithGoogle` sin `prompt:select_account`; (4) `desconectarCalendar` **conserva** la fila `google_tokens` (solo limpia flag + ref) para que reconectar sea instantáneo — revocar real se hace desde la cuenta de Google. La sesión de Supabase ya se persiste (login de una vez). |

---

## Módulo: Vista Web Alumno

| # | Tarea | Estado | Spec |
|---|---|---|---|
| VW-01 | Definir arquitectura del link público | ⬜ | vista-alumno.md |
| VW-02 | Endpoint/route pública en Supabase | ⬜ | vista-alumno.md |
| VW-03 | UI web de la vista del alumno | ⬜ | vista-alumno.md |
| VW-04 | Botón compartir link por WhatsApp en perfil alumno | ⬜ | vista-alumno.md |

---

## Módulo: Cobro por transferencia (v1)

> Spec: `cobro-transferencia.md`. Decisión 2026-06-13: en vez de integrar una pasarela, la v1 **asiste un cobro por transferencia bancaria manual**. La app arma un mensaje de WhatsApp (monto exacto + detalle de clases + datos bancarios del profesor); el profesor marca las clases pagadas con el toggle existente al recibir la transferencia. Cero comisión, cero infraestructura (sin Edge Functions/webhook/tabla de pagos/vista pública). Reusa el toggle `pagada`, `alumnos.whatsapp` y `user_metadata`.

| # | Tarea | Estado | Spec |
|---|---|---|---|
| CT-01 | Sección "Datos de cobro" en Ajustes (titular, RUT, banco, tipo y N° de cuenta, email) persistidos en `user_metadata.datos_cobro` | ✅ | cobro-transferencia.md + ajustes.md — hecho 2026-06-13: formulario en Ajustes con Nombre, RUT, **Banco** (desplegable, 21 instituciones CL), **Tipo de cuenta** (desplegable: Corriente/Vista/Ahorro/Chequera Electrónica), N° de cuenta y Email (opcional). Persiste vía `AuthContext.updateDatosCobro`. |
| CT-02 | Botón "Generar cobro" en perfil alumno | ✅ | cobro-transferencia.md — hecho 2026-06-13: botón verde WhatsApp en perfil alumno, deshabilitado si no hay clases realizadas no pagadas; si faltan datos de cobro, ofrece "Ir a Ajustes" antes de abrir el modal. |
| CT-03 | Botón "Generar cobro" en perfil taller | ✅ | cobro-transferencia.md §"Cobro de taller" — hecho 2026-06-15: el botón "Generar cobro" ahora aparece también en talleres; abre un selector de participante (hidratado desde `alumnos` para su WhatsApp), luego el modal de clases con monto = la parte del alumno (`montoDeClase / nº participantes`, redondeado) y envía al WhatsApp de ese participante. Deshabilitado si no hay clases cobrables o el taller no tiene participantes. Limitación v1: el toggle `pagada` sigue siendo por clase. |
| CT-04 | Modal de selección de clases (checkboxes, preselección de realizadas no pagadas, total vivo) | ✅ | cobro-transferencia.md — hecho 2026-06-13: modal con checkboxes (todas preseleccionadas), total vivo. |
| CT-05 | Generar el mensaje y abrir WhatsApp con el texto prellenado (deep link `whatsapp://` / `wa.me`) | ✅ | cobro-transferencia.md — hecho 2026-06-13: botón "Enviar" (WhatsApp, ancho completo) + "Cancelar" debajo; arma mensaje con detalle + total (+ datos bancarios si existen en `user_metadata`) y abre WhatsApp al número del alumno (normaliza a +56). |
| CT-06 | Atajo "Generar cobro" en las tarjetas de Finanzas | ⬜ | cobro-transferencia.md + finanzas.md |

---

## Módulo: Pagos con pasarela (POSPUESTO — futuro)

> ⏸️ **Pospuesto el 2026-06-13.** La v1 usa cobro manual asistido (sección anterior). Toda esta sección queda como diseño de referencia para cuando se retome la pasarela automática (Khipu, ya investigado — ver `cobro-transferencia.md` §Mejora futura).
> Spec de referencia en `pagos-flow.md` (a reescribir contra Khipu si se retoma). Decisiones cerradas en su momento: pago = bundle de clases · disparador manual · comisión absorbida por profesor · link público sin login · expiración 7 días.
> Todas las tareas PF-01..24 quedan en estado ⏸️ (futuro).

### Infraestructura

| # | Tarea | Estado | Spec |
|---|---|---|---|
| PF-01 | Cuenta comercial Flow configurada (sandbox + producción) | ⬜ | pagos-flow.md |
| PF-02 | Migración Supabase: tablas `pagos`, `pagos_clases` + RLS + índices | ⬜ | pagos-flow.md § Modelo de datos |
| PF-03 | Edge Function `crear-pago`: valida clases, **calcula el monto server-side leyendo la DB** (nunca acepta el total del cliente), llama a la pasarela, inserta `pagos` + `pagos_clases` | ⬜ | pagos-flow.md § Criterios — modal |
| PF-04 | Edge Function `webhook-flow`: valida firma, confirma via `getStatus`, transiciona a `pagado` (idempotente) | ⬜ | pagos-flow.md § Webhook |
| PF-05 | Edge Function `anular-pago`: cancela en Flow si es posible, transiciona local a `anulado` | ⬜ | pagos-flow.md § Gestión |
| PF-06 | Edge Function `reembolsar-pago`: llama Flow `/payment/refund`, transiciona a `reembolsado`, revierte `clases.pagada` | ⬜ | pagos-flow.md § Gestión |
| PF-07 | Expiración perezosa: vista SQL o lógica en queries que transiciona `pendiente` → `expirado` cuando vence | ⬜ | pagos-flow.md § Expiración |
| PF-08 | Contexto **nuevo y separado** `PagosContext`: `crearPago`, `anularPago`, `reembolsarPago`, getters de `pagos` (no engordar `AlumnosContext`, ya es un god object de ~590 líneas) | ⬜ | pagos-flow.md |

### UI Profesor

| # | Tarea | Estado | Spec |
|---|---|---|---|
| PF-09 | Botón "Generar pago" en perfil alumno (debajo de Editar/Eliminar) | ⬜ | pagos-flow.md § Profesor — botón |
| PF-10 | Botón "Generar pago" en perfil taller | ⬜ | pagos-flow.md § Profesor — botón |
| PF-11 | Modal de selección de clases con checkboxes, total vivo, validación "ya solicitada" | ⬜ | pagos-flow.md § Profesor — modal |
| PF-12 | Pantalla "Link generado" con Compartir WhatsApp + Copiar link | ⬜ | pagos-flow.md § Profesor — link generado |
| PF-13 | Atajo "Generar pago" en cada tarjeta de Finanzas | ⬜ | pagos-flow.md + finanzas.md |
| PF-14 | Sección "Pagos solicitados" en Finanzas (Pendientes / Pagados / Expirados-Anulados / Reembolsados) | ⬜ | finanzas.md |
| PF-15 | Acción "Anular pago" desde Finanzas | ⬜ | pagos-flow.md § Gestión |
| PF-16 | Acción "Reembolsar" desde Finanzas | ⬜ | pagos-flow.md § Gestión |

### UI Alumno

| # | Tarea | Estado | Spec |
|---|---|---|---|
| PF-17 | Ruta pública `app/pago/[token].jsx` con build web habilitado | ⬜ | pagos-flow.md § Alumno — vista pública |
| PF-18 | Renderizado por estado (pendiente / pagado / expirado / anulado / reembolsado) | ⬜ | pagos-flow.md |
| PF-19 | Botón "Pagar con Flow" → redirige a `flow_url` | ⬜ | pagos-flow.md |
| PF-20 | Tema oscuro/claro respetando paleta MusicPlans | ⬜ | pagos-flow.md + constitución |

### Migración del toggle manual

| # | Tarea | Estado | Spec |
|---|---|---|---|
| PF-21 | Eliminar UI del toggle pagada en Finanzas y Perfil (cierra AL-18) | ⬜ | finanzas.md + alumnos.md |
| PF-22 | Eliminar mutador `togglePagadaClase` del contexto | ⬜ | alumnos.md |
| PF-23 | Manejo de borrado de clase incluida en pago: CASCADE en `pagos_clases`; si el pago queda sin clases → auto `anulado` | ⬜ | pagos-flow.md § Casos borde |
| PF-24 | Notificación push al profesor al confirmar pago | 🚫 | pagos-flow.md § Webhook — **bloqueada por decisión de alcance (ARQ-12):** la app solo tiene notificaciones locales; push server→dispositivo requiere registrar Expo Push Tokens + envío desde la Edge Function. Decidir si entra en v1 o el profesor se entera al abrir la app |
