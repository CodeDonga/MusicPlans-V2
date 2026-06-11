# Guía de Implementación — MusicPlans
> Cómo traducir una tarea de `4-tareas.md` a código.

---

## Proceso por tarea

1. **Identificar la tarea** en `4-tareas.md` → leer la spec del módulo en `2-especificacion/`.
2. **Verificar que la spec esté completa** — si falta información, actualizar la spec antes de codificar.
3. **Implementar** siguiendo las restricciones técnicas de la spec y la constitución.
4. **Marcar como ✅** en `4-tareas.md` al terminar.
5. **Si se descubre algo no especificado** → agregar a la spec antes de implementarlo.

---

## Checklist antes de codificar

- [ ] ¿Existe la spec del módulo en `2-especificacion/`?
- [ ] ¿Los criterios de aceptación están claros y son verificables?
- [ ] ¿El cambio requiere modificar la constitución? Si sí → parar y consensuar.
- [ ] ¿El cambio afecta contratos en `3-planificacion.md`? Si sí → actualizar planificación primero.

---

## Patrones establecidos

### Mutar datos (crear/editar/eliminar)
```js
// 1. Update optimista
setState(prev => ...)
// 2. Persistir en Supabase
const { error } = await supabase.from('tabla').insert/update/delete(...)
// 3. Si error → revertir y recargar
if (error) cargarDatos()
```

### Consumir datos en pantallas
```js
// Siempre desde contexto — sin fetch directo
const { alumnos, agregarAlumno } = useAlumnos()
const { colores } = useTema()
const { session } = useAuth()
```

### Colores
```js
// Siempre desde TemaContext
const { colores } = useTema()
// Usar: colores.bg, colores.primary, colores.text, etc.
// NUNCA: color: '#001230' hardcodeado
```

---

## Stack de dependencias por módulo

| Módulo | Dependencias clave |
|---|---|
| Auth | `expo-web-browser`, `expo-linking`, `@supabase/supabase-js` |
| Notificaciones | `expo-notifications` |
| Google Calendar | fetch nativo a `googleapis.com` |
| Pagos Flow | por definir |
| Vista web alumno | por definir |
