# Especificación — Autenticación
> Módulo: `app/login.jsx`, `app/registro.jsx`, `context/AuthContext.jsx`

---

## Historia de usuario

**Como** profesor de música,  
**quiero** ingresar a MusicPlans con mi correo/contraseña o con Google,  
**para** acceder a mis alumnos y clases desde cualquier dispositivo.

---

## Criterios de aceptación

### Login con email/contraseña
- [ ] El profesor ingresa correo y contraseña válidos → accede a la app.
- [ ] Credenciales incorrectas → mensaje de error visible (no alert nativo).
- [ ] Campo vacío al presionar "Ingresar" → validación inline antes de llamar a Supabase.
- [ ] Link "Olvidaste tu contraseña?" → dispara flujo de reset por email de Supabase.

### Login con Google
- [ ] Presionar "Ingresar con Google" → abre OAuth en browser interno (WebBrowser).
- [ ] Autenticación exitosa → sesión activa, navega a `(tabs)`.
- [ ] Usuario cancela el flujo OAuth → vuelve a la pantalla de login sin error.

### Registro
- [ ] El profesor ingresa nombre, correo y contraseña → crea cuenta en Supabase.
- [ ] Correo ya registrado → mensaje de error claro.
- [ ] Contraseña menor a 6 caracteres → error inline antes de llamar a Supabase.
- [ ] Registro exitoso → sesión activa, navega a `(tabs)`.

### Sesión persistente
- [ ] Al abrir la app con sesión activa → navega directamente a `(tabs)` sin pasar por login.
- [ ] Al hacer logout → navega a `login.jsx`, limpia todos los estados de contexto.

---

## Restricciones técnicas

- Usar `supabase.auth.signInWithPassword` / `signUp` / `signInWithOAuth`.
- `AuthContext` expone: `session`, `loading`, `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `updatePerfil`, `conectarCalendar`, `getCalendarToken`.
- El token de Google Calendar se guarda en `user_metadata.google_calendar_token` de Supabase.
- No usar `SecureStore` ni `AsyncStorage` para tokens — Supabase los gestiona internamente.

---

## Estado actual

- **Implementado:** signIn, signUp, signOut, signInWithGoogle, updatePerfil, conectarCalendar, getCalendarToken.
- **Pendiente:** UI de "Olvidaste tu contraseña?", validaciones inline en formularios.
