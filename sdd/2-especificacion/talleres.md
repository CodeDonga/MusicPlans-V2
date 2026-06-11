# Especificación — Talleres
> Módulo: `app/nuevo-taller.jsx`, `app/(tabs)/index.jsx` (comparte lista con alumnos), `context/AlumnosContext.jsx`

---

## Historia de usuario

**Como** profesor de música,  
**quiero** crear talleres grupales con múltiples participantes,  
**para** gestionar clases colectivas y calcular ingresos por grupo.

---

## Criterios de aceptación

### Lista de talleres (pantalla Inicio)
- [ ] Los talleres aparecen en la misma lista que los alumnos (FlatList unificada).
- [ ] Cada tarjeta de taller muestra: avatar (emoji instrumento/disciplina), nombre del taller, instrumento, día y hora, texto "Ver Perfil →".
- [ ] Presionar → navega al perfil del taller (misma pantalla que perfil de alumno, adaptada).

### Agregar taller
- [ ] Campos obligatorios: nombre del taller, instrumento/disciplina, día habitual, hora habitual.
- [ ] Campos opcionales: valor por alumno (CLP).
- [ ] Lista de participantes: botón "＋ Agregar alumno al taller" → busca entre alumnos existentes o crea nuevo.
- [ ] Un taller puede tener participantes de distintos instrumentos.
- [ ] "Guardar" → crea optimistamente, persiste en Supabase, navega al inicio.
- [ ] "Cancelar" → descarta.

### Valor del taller
- [ ] `valor_unitario` de cada clase = `valor_por_alumno × cantidad de participantes`.
- [ ] Si hay `valor_custom` en la clase → usar ese en vez del calculado.

### Gestión de clases del taller
- [ ] Igual que alumnos: agregar, editar, eliminar clases, cambiar estado, toggle pagada.
- [ ] Al eliminar taller con clases pagadas → preservar en `pagosHistoricos`.

---

## Modelo de datos (Supabase)

### Tabla `talleres`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| nombre | text | |
| instrumento | text | |
| avatar | text | emoji |
| valor_por_alumno | integer | CLP |
| dia_semana | text | |
| hora | text | HH:MM |
| tipo | text | siempre 'taller' |
| participantes | jsonb | array de IDs (UUIDs de la tabla `alumnos`). Los nombres se hidratan en el cliente desde `alumnos` al cargar. |
| created_at | timestamptz | |

---

## Restricciones técnicas

- RLS: `user_id = auth.uid()`.
- `participantes` es JSONB en Supabase con array de IDs (no de objetos). El mapper `dbToTaller` hidrata `{id, nombre}` a partir de `alumnos`. El mapper `tallerToDB` extrae IDs (`extraerIds`) y tolera ambos formatos en lectura para compatibilidad con registros antiguos.
- El valor de la clase se recalcula en `agregarClase`: `valorPorAlumno * participantes.length`.

---

## Estado actual

- **Implementado:** CRUD completo de talleres, multi-instrumento, clases.
- **Pendiente:** UI de búsqueda/selección de alumnos existentes como participantes.
