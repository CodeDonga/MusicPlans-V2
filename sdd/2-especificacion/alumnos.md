# Especificación — Alumnos
> Módulo: `app/(tabs)/index.jsx`, `app/nuevo-alumno.jsx`, `app/(tabs)/perfil.jsx`, `context/AlumnosContext.jsx`

---

## Historia de usuario

**Como** profesor de música,  
**quiero** gestionar la lista de mis alumnos (crear, ver, editar, eliminar),  
**para** tener un registro centralizado de cada estudiante y sus clases.

---

## Criterios de aceptación

### Lista de alumnos (pantalla Inicio)
- [ ] Muestra todos los alumnos del profesor autenticado, ordenados por `created_at`.
- [ ] Cada tarjeta muestra: avatar (emoji instrumento), nombre, instrumento, día y hora de próxima clase, texto "Ver Perfil →".
- [ ] Presionar tarjeta → navega a `perfil` con el id del alumno.
- [ ] Lista vacía → estado vacío con ícono + "Sin alumnos aún" + "Toca + para agregar tu primer alumno". Presionar estado vacío → abre formulario Agregar Alumno.
- [ ] FAB `+` en esquina inferior derecha → despliega dos opciones: "Agregar alumno" y "Agregar taller".

### Agregar alumno
- [ ] Campos obligatorios: nombre, instrumento, día habitual, hora habitual.
- [ ] Campos opcionales: whatsapp, valor de la clase (CLP).
- [ ] Instrumento: selector visual con botones (Guitarra, Piano, Bajo, Batería, Canto, Saxofón, Trompeta, Violín).
- [ ] "Guardar Alumno" → crea optimistamente, persiste en Supabase, navega al inicio.
- [ ] "Cancelar" → descarta y vuelve sin guardar.

### Perfil del alumno
- [ ] Muestra: avatar grande, nombre, instrumento, día, hora.
- [ ] Botón "Editar" → abre Modal Editar Alumno con datos pre-cargados.
- [ ] Botón "Eliminar" → Alert: "¿Eliminar alumno? Una vez realizado no podrás volver atrás." Botones: Cancelar | Eliminar.
  - Al confirmar: elimina optimistamente, preserva clases pagadas en `pagosHistoricos`, borra clases no pagadas de Supabase, navega al inicio.

### Editar alumno (modal)
- [ ] Campos editables: nombre, instrumento, día habitual, hora habitual.
- [ ] "Guardar Cambios" → actualiza optimistamente y persiste en Supabase.
- [ ] "Cancelar" → descarta cambios.

### Registro de clases (dentro de Perfil)
- [ ] Lista de clases del alumno ordenadas por fecha descendente.
- [ ] Cada clase muestra: fecha (color primario, uppercase), "Clase #N", badge de estado, planificación, tareas.
- [ ] Badge de estado es presionable → despliega selector con los 4 estados: Pendiente / Realizada / Cancelada / Reagendada.
- [ ] Al seleccionar **Reagendada** → cambia el estado y abre automáticamente el modal de edición de clase para que el profesor actualice la nueva fecha/hora.
- [ ] Botón "Editar clase" → Modal Editar Clase.
- [ ] Botón eliminar clase → Alert: "¿Eliminar clase? Esta acción no se puede deshacer." Botones: Cancelar | Eliminar.
- [ ] Formulario "Agregar clase": fecha/hora, planificación (multiline), tarea (multiline), valor personalizado opcional. "Guardar Clase" persiste.

---

## Modelo de datos (Supabase)

### Tabla `alumnos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK, generado |
| user_id | uuid | FK auth.users |
| nombre | text | |
| instrumento | text | |
| avatar | text | emoji |
| whatsapp | text | nullable |
| valor_clase | integer | CLP |
| dia_semana | text | |
| hora | text | HH:MM |
| tipo | text | siempre 'alumno' |
| created_at | timestamptz | |

### Tabla `clases`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| entidad_id | uuid | FK alumnos.id o talleres.id |
| entidad_tipo | text | 'alumno' o 'taller' |
| entidad_nombre | text | desnormalizado para histórico |
| fecha | text | YYYY-MM-DD |
| hora | text | HH:MM |
| planificacion | text | nullable |
| tareas | text | nullable |
| estado | text | 'pendiente' / 'realizada' / 'cancelada' |
| pagada | boolean | default false |
| valor_unitario | integer | CLP al momento de creación |
| valor_custom | integer | nullable, override manual |
| google_event_id | text | nullable |
| created_at | timestamptz | |

---

## Restricciones técnicas

- RLS en Supabase: `user_id = auth.uid()` en todas las operaciones.
- Mutaciones siempre optimistas (actualizar estado local → Supabase → revertir si error).
- Al eliminar alumno con clases pagadas → mover a `pagosHistoricos` antes de eliminar.
- Clases canceladas no reciben notificación push ni evento en Google Calendar.

---

## Estados de clase

| Estado | Color | Comportamiento al seleccionar |
|---|---|---|
| `pendiente` | `paleta.primary` | ninguno |
| `realizada` | `paleta.success` | ninguno |
| `cancelada` | `paleta.alert` | cancela notificación + elimina evento Calendar |
| `reagendada` | `paleta.warning` | abre modal de edición para actualizar fecha/hora |

### Toggle pagada (simetría con estado)
- [x] Al marcar `pagada = true` → si el `estado` actual no es `realizada`, cambiar automáticamente a `realizada` y cancelar la notificación programada. Justificación: una clase pagada implica que ya ocurrió; mantenerla como "pendiente" la oculta de Finanzas/Agenda de forma inconsistente.
- [x] Al marcar `pagada = false` → si el `estado` actual es `realizada`, revertir a `pendiente` y re-programar la notificación si la clase sigue en el futuro. Si el estado es `cancelada`/`reagendada`, no se toca (el usuario lo eligió a propósito).

---

## Estado actual

- **Implementado:** CRUD completo de alumnos, registro de clases, cambio de estado (4 estados), toggle pagada, valor personalizado por clase.
- **Pendiente:** validaciones de campos obligatorios en formulario de nuevo alumno.
