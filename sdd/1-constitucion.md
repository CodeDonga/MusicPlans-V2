# Constitución — MusicPlans
> Reglas no negociables. Ningún cambio de código las puede ignorar.  
> Para modificar este documento: consenso explícito del equipo + commit dedicado.

---

## Stack tecnológico (inmutable)

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | React Native + Expo | SDK 54 |
| Navegación | Expo Router | v4 |
| Backend / DB | Supabase | último |
| Auth | Supabase Auth (email + Google OAuth) | — |
| Lenguaje | JavaScript (JSX) — sin TypeScript | — |
| Gestión de estado | Context API (no Redux, no Zustand) | — |
| Notificaciones | Expo Notifications | — |
| Calendario | Google Calendar API | — |
| Pagos | Flow (Chile) | — |

---

## Arquitectura (inmutable)

- **Estado global:** `AlumnosContext` para datos (alumnos, talleres, clases, pagos). `TemaContext` para tema. `AuthContext` para sesión.
- **Persistencia:** Supabase para todo excepto preferencia de tema (AsyncStorage).
- **Navegación:** Stack + Tabs. Tabs: Alumnos · Agenda · Ajustes.
- **Mutaciones:** siempre optimistas — actualizar estado local primero, luego Supabase, revertir si hay error.
- **Autenticación:** toda pantalla dentro de `(tabs)/` requiere sesión activa. `login.jsx` y `registro.jsx` son públicas.

---

## Convenciones de código (inmutable)

- Archivos de pantalla en `app/` con extensión `.jsx`.
- Contextos en `context/`. Utilidades en `lib/`.
- Variables y funciones en **camelCase español** (`alumno`, `agregarClase`, `diaSemana`).
- Columnas de Supabase en **snake_case** (`valor_clase`, `dia_semana`). Mappers DB↔App obligatorios.
- **Sin comentarios** salvo que el WHY sea no obvio (invariante oculta, workaround específico).
- Sin `console.log` en producción.
- Sin TypeScript, sin migración a TypeScript mientras no esté en esta constitución.

---

## Diseño (inmutable)

### Paleta — Tema Oscuro (predeterminado)
```
bg:             #001230
bgCard:         #111827
bgInput:        #1B263B
primary:        #00C2D1
hover:          #45DEED
secondary:      #7C3AED
text-title:     #E5E7EB
text-body:      #D1D5DB
text-muted:     #9CA3AF
success:        #10B981
alert:          #F87171
glow:           rgba(0, 194, 209, 0.06)
border-subtle:  rgba(36, 53, 84, 0.2)
border-primary: rgba(0, 194, 209, 0.1)
```

### Paleta — Tema Claro
```
bg:         #f7fafe
bgCard:     #ffffff
primary:    #004ac6
secondary:  #712ae2
text:       #181c1f
```

- **Fuente:** Inter (Expo Google Fonts). Pesos: 400, 500, 600, 700, 800.
- Cards con sombra glow en color primario (baja opacidad).
- Botones primarios con glow.
- Siempre respetar tema activo desde `TemaContext` — sin colores hardcodeados.

---

## Seguridad (inmutable)

- **Row Level Security (RLS) activo** en todas las tablas de Supabase. Cada usuario solo ve sus datos.
- Las claves de Supabase van en `.env`, nunca en el código fuente.
- El archivo `.env` nunca se commitea (está en `.gitignore`).
- No almacenar tokens de acceso en AsyncStorage. Usar `supabase.auth` para gestión de sesión.

---

## Mercado objetivo

- Chile como mercado inicial.
- Moneda: pesos CLP.
- Métodos de pago: Flow (tarjeta crédito/débito + transferencia bancaria).
- Idioma UI: español.
