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

### Recuperar contraseña (A-07)
- [ ] Al presionar el link con el campo correo vacío o inválido → error inline "Ingresa tu correo para enviarte el link".
- [ ] Con correo válido → `supabase.auth.resetPasswordForEmail(email, { redirectTo: scheme de la app })` y mensaje inline de confirmación "Te enviamos un correo para restablecer tu contraseña".
- [ ] Al abrir el link del correo → la app captura el deep link, detecta `type=recovery`, establece la sesión de recuperación y navega a `app/nueva-contrasena.jsx`.
- [ ] `nueva-contrasena.jsx`: dos campos (nueva contraseña + confirmación), validación inline (mínimo 6 caracteres, coincidencia), botón "Guardar contraseña" → `supabase.auth.updateUser({ password })` → confirmación y navegación a `(tabs)`.
- [ ] Mientras `recuperandoPassword` esté activo, el AuthGate enruta a `nueva-contrasena.jsx` aunque haya sesión.

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

- Usar `supabase.auth.signInWithPassword` / `signUp` / `signInWithOAuth` / `resetPasswordForEmail`.
- `AuthContext` expone: `session`, `loading`, `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `updatePerfil`, `conectarCalendar`, `desconectarCalendar`, `getCalendarToken`, `resetPassword`, `updatePassword`, `recuperandoPassword`.
- **El token de Google nunca se persiste** (ni en metadata, ni en AsyncStorage — ver BUG-07/BUG-21). Vive solo en `session.provider_token`; en `user_metadata` se guarda únicamente el flag booleano `google_calendar_connected`.
- No usar `SecureStore` ni `AsyncStorage` para tokens — Supabase los gestiona internamente.

---

## Estado actual

- **Implementado:** signIn, signUp, signOut, signInWithGoogle, updatePerfil, conectarCalendar, getCalendarToken, validaciones inline (A-06), flujo recuperar contraseña (A-07).
