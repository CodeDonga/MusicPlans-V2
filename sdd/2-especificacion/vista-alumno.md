# Especificación — Vista Web del Alumno
> Estado: PENDIENTE DE IMPLEMENTACIÓN

---

## Historia de usuario

**Como** profesor de música,  
**quiero** compartir un link con mi alumno para que vea su tarea y próxima clase,  
**para** que el alumno esté informado sin necesidad de descargar una app.

---

## Criterios de aceptación

- [ ] Cada alumno tiene un link único generado por MusicPlans.
- [ ] El profesor puede compartir el link desde el perfil del alumno (botón compartir por WhatsApp).
- [ ] El alumno abre el link en cualquier navegador (sin login, sin app).
- [ ] La vista web muestra:
  - [ ] Nombre del alumno.
  - [ ] Tarea asignada (última clase con tarea).
  - [ ] Fecha y hora de próxima clase.
  - [ ] Botón "Pagar clase" → redirige a pasarela Flow.
- [ ] La vista web respeta el tema visual de MusicPlans (colores, fuentes).

---

## Restricciones técnicas

- El link debe ser único por alumno (puede usar el `id` del alumno en Supabase o un token opaco).
- La vista web es solo lectura — el alumno no puede modificar nada.
- Requiere endpoint o route pública en Supabase (o una ruta de Expo Router con soporte web).
- RLS debe permitir lectura pública del link (o usar un token firmado).
- Integración con Flow para el botón de pago (ver spec `pagos-flow.md`).

---

## Estado actual

- **Pendiente:** diseño de arquitectura, definición del endpoint público, UI web.
