# Especificación — Ajustes
> Módulo: `app/(tabs)/ajustes.jsx`, `context/TemaContext.jsx`, `context/AuthContext.jsx`

---

## Historia de usuario

**Como** profesor de música,  
**quiero** personalizar la apariencia de la app y gestionar mi perfil,  
**para** adaptar la experiencia a mis preferencias.

---

## Criterios de aceptación

### Apariencia
- [ ] Selector visible: "Tema Oscuro 🌙" / "Tema Claro ☀️".
- [ ] Al cambiar → el tema se aplica inmediatamente en toda la app via `TemaContext`.
- [ ] La preferencia persiste en AsyncStorage (sobrevive cierre de app).

### Perfil del profesor
- [ ] Muestra nombre y correo del profesor autenticado (desde `AuthContext.session`).
- [ ] Botón "Editar nombre" → input inline o modal para actualizar el nombre.
- [ ] Guardar nombre → llama a `updatePerfil(nombre)` de `AuthContext`.

### Google Calendar
- [ ] Muestra si Google Calendar está conectado o no.
- [ ] Botón "Conectar Google Calendar" → llama a `conectarCalendar()`.
- [ ] Si ya está conectado → muestra "Conectado ✓" y opción de desconectar.

### Suscripción
- [ ] Muestra estado de suscripción: activa / vencida / periodo de prueba.
- [ ] Fecha de vencimiento.
- [ ] Botón "Renovar suscripción".
- [ ] _(Funcionalidad de pagos por definir — ver sección 9 de la constitución)_

### Cerrar sesión
- [ ] Botón "Cerrar sesión" → Alert de confirmación → llama a `signOut()` → navega a login.

---

## Restricciones técnicas

- `TemaContext` expone: `tema`, `setTema`, `colores` (paleta completa según tema activo).
- Siempre consumir colores desde `colores` del tema — sin hardcodear.
- `AuthContext.updatePerfil` actualiza `user_metadata.nombre` en Supabase.

---

## Estado actual

- **Implementado:** selector de tema, perfil básico, cerrar sesión.
- **Pendiente:** Google Calendar status/desconectar, suscripción (funcionalidad pendiente de definir).
