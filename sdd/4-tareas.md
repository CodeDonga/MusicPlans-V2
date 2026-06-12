# Backlog de Tareas — MusicPlans
> Tareas atómicas y verificables. Cada tarea tiene un criterio de aceptación claro.  
> Estado: ✅ Hecho | 🔄 En progreso | ⬜ Pendiente | 🚫 Bloqueado
>
> **Bugs conocidos:** sin pendientes. BUG-20..28, ARQ-07..09 corregidos el 2026-06-11; BUG-29 corregido y verificado en dispositivo el 2026-06-12.

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
| AL-18 | ⚠️ DEPRECAR AL-14 y AL-17: el toggle manual de pagada se elimina | ⬜ | alumnos.md + pagos-flow.md — `pagada` pasa a ser efecto del estado del pago. Reemplazo: el profesor cobra vía Flow (PF-03 en adelante). Ver PF-17 para la migración. |

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
| F-03 | Detalle expandible por alumno (sin toggle — solo lectura + atajo Generar pago) | ⬜ | finanzas.md — redefinida: el toggle manual se elimina con PF-17 |
| F-04 | Selector de mes | ✅ | finanzas.md — flechas + swipe horizontal en `finanzas.jsx:95-103` |
| F-05 | Sección histórico de eliminados | ✅ | finanzas.md — footer "Pagos históricos" en `finanzas.jsx:150-181` |
| F-06 | Badge "Esperando pago" cuando existe pago `pendiente` para el alumno | ⬜ | finanzas.md |

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

---

## Módulo: Vista Web Alumno

| # | Tarea | Estado | Spec |
|---|---|---|---|
| VW-01 | Definir arquitectura del link público | ⬜ | vista-alumno.md |
| VW-02 | Endpoint/route pública en Supabase | ⬜ | vista-alumno.md |
| VW-03 | UI web de la vista del alumno | ⬜ | vista-alumno.md |
| VW-04 | Botón compartir link por WhatsApp en perfil alumno | ⬜ | vista-alumno.md |

---

## Módulo: Pagos Flow

> Spec completa en `pagos-flow.md`. Decisiones cerradas: pago = bundle de clases · disparador manual · comisión absorbida por profesor · link público sin login · expiración 7 días.

### Infraestructura

| # | Tarea | Estado | Spec |
|---|---|---|---|
| PF-01 | Cuenta comercial Flow configurada (sandbox + producción) | ⬜ | pagos-flow.md |
| PF-02 | Migración Supabase: tablas `pagos`, `pagos_clases` + RLS + índices | ⬜ | pagos-flow.md § Modelo de datos |
| PF-03 | Edge Function `crear-pago`: valida clases, llama Flow `/payment/create`, inserta `pagos` + `pagos_clases` | ⬜ | pagos-flow.md § Criterios — modal |
| PF-04 | Edge Function `webhook-flow`: valida firma, confirma via `getStatus`, transiciona a `pagado` (idempotente) | ⬜ | pagos-flow.md § Webhook |
| PF-05 | Edge Function `anular-pago`: cancela en Flow si es posible, transiciona local a `anulado` | ⬜ | pagos-flow.md § Gestión |
| PF-06 | Edge Function `reembolsar-pago`: llama Flow `/payment/refund`, transiciona a `reembolsado`, revierte `clases.pagada` | ⬜ | pagos-flow.md § Gestión |
| PF-07 | Expiración perezosa: vista SQL o lógica en queries que transiciona `pendiente` → `expirado` cuando vence | ⬜ | pagos-flow.md § Expiración |
| PF-08 | Mutadores en `AlumnosContext`: `crearPago`, `anularPago`, `reembolsarPago`, getters de `pagos` | ⬜ | pagos-flow.md |

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
| PF-24 | Notificación push al profesor al confirmar pago | ⬜ | pagos-flow.md § Webhook |
