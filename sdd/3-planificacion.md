# Planificación Técnica — MusicPlans
> Traduce las especificaciones en arquitectura concreta: interfaces, contratos y dependencias.

---

## Estructura de carpetas (actual y objetivo)

```
app/
  _layout.jsx              ← Raíz: AuthProvider + AlumnosProvider + TemaProvider + Stack
  login.jsx                ← Pública
  registro.jsx             ← Pública
  (tabs)/
    _layout.jsx            ← Tab navigator (Alumnos · Agenda · Ajustes)
    index.jsx              ← Lista alumnos + talleres
    agenda.jsx             ← Próximas sesiones
    finanzas.jsx           ← Resumen de pagos
    ajustes.jsx            ← Tema + perfil + suscripción
    perfil.jsx             ← Perfil alumno/taller + clases
  nuevo-alumno.jsx
  nuevo-taller.jsx

context/
  AuthContext.jsx          ← Sesión, login, registro, Google OAuth, Calendar token
  AlumnosContext.jsx       ← Alumnos, talleres, clases, pagos — fuente única de datos
  TemaContext.jsx          ← Tema activo + paleta de colores

lib/
  supabase.js              ← Cliente Supabase
  notificaciones.js        ← programarNotificacion, cancelarNotificacion
  googleCalendar.js        ← crearEvento, editarEvento, eliminarEvento
  fechas.js                ← helpers de formato de fecha en español

sdd/                       ← Este directorio — documentación SDD
```

---

## Contratos entre capas

### AuthContext → Pantallas
```js
{ 
  session,           // objeto Supabase Session | null
  loading,           // boolean — mientras verifica sesión inicial
  signIn(email, password),
  signUp(email, password, nombre),
  signOut(),
  signInWithGoogle(),
  updatePerfil(nombre),
  conectarCalendar(),  // retorna boolean
  getCalendarToken()   // retorna string | null
}
```

### AlumnosContext → Pantallas
```js
{
  alumnos,           // Alumno[]
  talleres,          // Taller[]
  clases,            // Record<string, Clase[]>  — clave: entidad_id
  pagosHistoricos,   // PagoHistorico[]
  agregarAlumno(alumno),
  editarAlumno(alumno),
  eliminarAlumno(id),
  agregarTaller(taller),
  editarTaller(taller),
  eliminarTaller(id),
  agregarClase(entidadId, clase),
  editarClase(entidadId, clase),
  eliminarClase(entidadId, claseId),
  cambiarEstadoClase(entidadId, claseId, estado),
  togglePagadaClase(entidadId, claseId, pagada)
}
```

### TemaContext → Pantallas
```js
{
  tema,              // 'oscuro' | 'claro'
  paleta,            // objeto con toda la paleta según tema activo
  toggleTema(tema)   // setter — persiste en AsyncStorage
}
```

---

## Flujo de datos crítico: Agregar clase

```
Usuario presiona "Guardar clase"
  → agregarClase(entidadId, clase)
    → update optimista en setClases (tempId)
    → INSERT en supabase.clases
    → si ok:
        → programarNotificacion(id, nombre, fecha, hora)
        → si google_token:
            → crearEvento(token, clase, nombre)
            → UPDATE google_event_id en supabase
    → si error:
        → revertir setClases (quitar tempId)
```

---

## Orden de providers (raíz)

```jsx
<TemaProvider>          // sin dependencias
  <AuthProvider>        // sin dependencias
    <AlumnosProvider>   // depende de supabase.auth (directo, no via useAuth)
      <AuthGate />
      <Stack />
    </AlumnosProvider>
  </AuthProvider>
</TemaProvider>
```

> Estado actual: `AlumnosProvider` está como padre de `AuthProvider` en el código. Funciona porque `AlumnosContext` escucha `supabase.auth.onAuthStateChange` directamente. **Pendiente corregir el orden** (tarea ARQ-01).

---

## Dependencias externas

| Servicio | Uso | Crítico |
|---|---|---|
| Supabase | DB + Auth | Sí |
| Google Calendar API | Sincronización clases | No (falla silenciosa) |
| Expo Notifications | Recordatorios locales | No |
| Flow | Pagos online | Pendiente |

---

## Pantallas pendientes de implementar

| Pantalla | Spec | Prioridad |
|---|---|---|
| Vista web alumno | `2-especificacion/vista-alumno.md` | Media |
| Pagos Flow | `2-especificacion/pagos-flow.md` | Media |
| Detalle de suscripción | `2-especificacion/ajustes.md` | Baja |
