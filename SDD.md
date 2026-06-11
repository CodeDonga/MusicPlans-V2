# MusicPlans — Especificación de Software (SDD)
### Versión 2.0 — 2026-05-28

> ⚠️ Este archivo es el documento original de referencia.  
> La fuente de verdad activa y mantenida está en **[`sdd/`](sdd/README.md)**.

---

## 1. Descripción General

MusicPlans es una app móvil para profesores de música que permite gestionar alumnos y talleres, planificar sesiones, asignar tareas, sincronizar con Google Calendar y recibir pagos online.

**Plataforma:** iOS y Android  
**Framework:** React Native + Expo (TypeScript)  
**Backend:** Supabase (base de datos + autenticación)  
**Pagos:** Flow  
**Mercado inicial:** Chile  

---

## 2. Paleta de Colores y Diseño

### Tema Oscuro (predeterminado)
```
bg:              #001230
bgCard:          #111827
bgInput:         #1B263B
primary:         #00C2D1
hover:           #45DEED
secondary:       #4C1D95
text-title:      #E5E7EB
text-body:       #D1D5DB
text-muted:      #9CA3AF
success:         #10B981
alert:           #F87171
glow:            rgba(0, 194, 209, 0.06)
border-subtle:   rgba(36, 53, 84, 0.2)
border-primary:  rgba(0, 194, 209, 0.1)
```

### Tema Claro
```
bg:              #f7fafe
bgCard:          #ffffff
primary:         #004ac6
secondary:       #712ae2
text:            #181c1f
```

### Tipografía
- **Fuente:** Inter (@expo-google-fonts/inter)
- Pesos utilizados: 400, 500, 600, 700, 800

### Efectos visuales
- Cards con sombra en color primario con baja opacidad (efecto glow)
- Inputs con fondo oscuro y borde sutil
- Botones primarios con glow en color primario
- Gradiente radial en fondos de formularios

---

## 3. Arquitectura Técnica

### Base existente (MusicPlan v1)
La app ya tiene construido en React Native + TypeScript + Expo Router:
- Lista de alumnos con tarjetas
- Perfil de alumno con historial de clases
- Agregar / editar / eliminar alumno
- Agregar / editar / eliminar clase (planificación + tareas)
- Sistema de tema oscuro/claro con paleta de colores (TemaContext)
- Estado global de alumnos (AlumnosContext)

### Lo que se agrega en V2
- Autenticación (Supabase Auth + Google OAuth)
- Talleres grupales
- Estados de sesión: Pendiente / Realizada / Cancelada
- Integración Google Calendar
- Notificaciones push (1 hora antes)
- Vista web del alumno (link único)
- Pagos online (Flow)
- Pantalla Finanzas
- Migración de AsyncStorage → Supabase

### Estructura de carpetas
```
app/
  _layout.tsx            ← Raíz: providers y Stack navigator
  AlumnosContext.tsx     ← Estado global: alumnos, talleres, clases
  TemaContext.tsx        ← Estado global: tema con Paleta de colores
  login.tsx              ← Pantalla: Login / registro
  (tabs)/
    _layout.tsx          ← Tab navigator inferior
    index.tsx            ← Pantalla: Lista de alumnos y talleres
    agenda.tsx           ← Pantalla: Próximas sesiones
    ajustes.tsx          ← Pantalla: Tema + perfil + suscripción
  perfil.tsx             ← Pantalla: Perfil alumno + clases
  nuevo-alumno.tsx       ← Pantalla: Formulario agregar alumno
  nuevo-taller.tsx       ← Pantalla: Formulario agregar taller
  finanzas.tsx           ← Pantalla: Resumen de pagos
components/
assets/
```

### Gestión de estado
- **Context API** para datos en memoria (alumnos, talleres, clases, tema)
- **Supabase** para persistencia en la nube
- **AsyncStorage** para tema

### Navegación
- **Expo Router** con Stack + Tabs
- Tab inferior: 👥 Alumnos · 📅 Agenda · ⚙️ Ajustes

---

## 4. Tipos de Usuario

| Usuario | Acceso |
|---|---|
| **Profesor** | App móvil (iOS / Android) |
| **Alumno** | Link web único — sin descargar app |

---

## 5. Autenticación

El profesor puede ingresar de dos formas:
- Usuario y contraseña propios de MusicPlans
- Login con Google (OAuth via Supabase)

---

## 6. Pantallas y Comportamiento

---

### 6.1 Pantalla: Login

**Elementos:**
- Logo MusicPlans centrado
- Input: correo
- Input: contraseña
- Link: Olvidaste tu contrasena?
- Botón: Ingresar
- Botón: Ingresar con Google
- Link: Crear cuenta

---

### 6.2 Pantalla: Alumnos (Inicio)

**Header:**
- Logo MusicPlans a la izquierda
- Subtítulo: "GESTIÓN DE TALENTO" (label pequeño uppercase)
- Título: "Alumnos" (36px, bold)

**Lista:**
- `FlatList` con tarjetas de cada alumno y taller
- Cada tarjeta muestra:
  - Avatar (emoji del instrumento)
  - Nombre
  - Instrumento
  - Día y hora de próxima clase
  - Texto "Ver Perfil →"
- Al presionar → navega a Perfil

**Estado vacío:**
- Ícono centrado + "Sin alumnos aún" + "Toca + para agregar tu primer alumno"
- Al presionar debe hacer lo mismo que agregar alumno. 
**FAB (botón flotante):**
- Botón `+` fijo en esquina inferior derecha, color primario con glow
- Al presionar → despliega dos opciones:
  - Agregar alumno → `nuevo-alumno`
  - Agregar taller → `nuevo-taller`

**Barra de navegación inferior:**
- 👥 ALUMNOS (activo)
- 📅 AGENDA
- ⚙️ AJUSTES

---

### 6.3 Pantalla: Agregar Alumno

**Campos:**
- Nombre (TextInput)
- Instrumento (botones visuales: Guitarra 🎸, Piano 🎹, Bajo 🎸, Bateria 🥁 
  Canto 🎤,  Saxofón 🎷, Trompeta 🎺, Violin 🎻, )
- WhatsApp (TextInput numérico)
- Valor de la clase (TextInput numérico, en pesos CLP)
- Día habitual (DatePicker — día de la semana)
- Hora habitual (TimePicker)

**Botones:**
- Guardar Alumno→ crea el alumno y vuelve al inicio
- Cancelar → vuelve sin guardar

---

### 6.4 Pantalla: Agregar Taller

**Campos:**
- Nombre del taller (TextInput)
- Instrumento / disciplina (selector)
- Valor por alumno (TextInput numérico)
- Día habitual (DatePicker)
- Hora habitual (TimePicker)
- Lista de participantes: botón "＋ Agregar alumno al taller" — busca y selecciona alumnos existentes o crea nuevos

**Botones:**
- Guardar → crea el taller y vuelve al inicio
- Cancelar

---

### 6.5 Pantalla: Perfil del Alumno

**Sección superior — Resumen:**
- Avatar grande (emoji del instrumento)
- Nombre
- Instrumento
- Día · Hora
- Botón: ✏️ Editar → abre Modal Editar Alumno
- Botón: 🗑️ Eliminar → Alert de confirmación

**Alert Eliminar Alumno:**
> "¿Eliminar alumno?"  
> "Una vez realizado no podrás volver atrás" 
> Botones: Cancelar | Eliminar

**Sección inferior — Registro de Clases:**
- Título: "Registro de Clases"
- Botón `＋ Agregar clase` → despliega formulario inline

**Formulario agregar clase:**
- Fecha y hora (DateTimePicker)
- Planificación (TextInput multiline)
- Tarea (TextInput multiline)
- Botón: Guardar Clase
- Botón: Cancelar

**Tarjetas de sesión — cada clase muestra:**
- Fecha (color primario, uppercase, pequeño)
- "Clase #X"
- Badge de estado: **Pendiente** / **Realizada** / **Cancelada**
- Al clickear el estado aparecera una lista con todos los estados y se podra modificar el estado de la clase asi. 
- Bloque Planificación (si tiene)
- Bloque Tareas (si tiene)
- Botón: ✏️ Editar clase → Modal Editar Clase
- Botón: 🗑️ → Alert confirmar eliminar

**Alert Eliminar Clase:**
> "¿Eliminar clase? Esta acción no se puede deshacer."  
> Botones: Cancelar | Eliminar

---

### 6.6 Modal: Editar Alumno

- Nombre
- Instrumento
- Día habitual
- Hora habitual
- Botones: 💾 Guardar Cambios | Cancelar

---

### 6.7 Modal: Editar Clase

- Fecha con defecto la fecha de hoy
- Planificación
- Tareas
- Estado (Pendiente / Realizada / Cancelada)
- Botones: 💾 Guardar | Cancelar

---

### 6.8 Pantalla: Agenda

Vista de todas las sesiones próximas ordenadas por fecha.  
Cada sesión: nombre del alumno, fecha, hora, estado.  
Al presionar → navega al perfil del alumno.

---

### 6.9 Pantalla: Finanzas

- Resumen del mes: ingresos totales, clases pagadas, clases pendientes de pago
- Lista de alumnos con estado de pago
- Al presionar un alumno → detalle de sus clases y pagos

---

### 6.10 Pantalla: Ajustes

- Apariencia: selector Tema Oscuro 🌙 / Tema Claro ☀️
- Perfil del profesor: nombre, email
- Suscripción: estado, fecha de vencimiento, botón renovar

---

## 7. Funcionalidades Adicionales

### 7.1 Google Calendar

- Al crear una sesión → se agrega automáticamente al Google Calendar del profesor
- Si hay conflicto de horario → alerta al profesor y pregunta si recalendarizar
- El alumno recibe la sesión en su Google Calendar vía link compartido

### 7.2 Notificaciones Push

- El profesor recibe notificación **1 hora antes** de cada sesión
- Implementación: Expo Notifications

### 7.3 Vista Web del Alumno

- Link único por alumno que el profesor comparte por WhatsApp
- El alumno abre en el navegador (sin descargar app) y ve:
  - Tarea asignada
  - Fecha y hora de próxima clase
  - Botón: **Pagar clase** → redirige a Flow

### 7.4 Pagos (Flow)

- El profesor define el valor de la clase al crear el alumno
- El alumno paga desde su link web
- Métodos: tarjeta de crédito, débito, transferencia bancaria
- El profesor ve en Finanzas: quién pagó, quién debe, resumen mensual

---

## 8. Modelo de Negocio

- Suscripción mensual para el profesor
- Precio por definir — validar con usuarios beta primero
- Período de prueba gratuito por definir

---

## 9. Bugs Conocidos

| ID | Módulo | Descripción | Estado |
|----|--------|-------------|--------|
| BUG-01 | Google Calendar | `provider_token` de Google no persiste entre sesiones — Supabase solo lo expone en la respuesta OAuth inicial, no en sesiones restauradas. `getGoogleToken()` siempre retorna `null` tras el primer arranque, bloqueando toda sincronización. **Fix:** almacenar el token en `user_metadata` al conectar. | Corregido |

---

## 10. Por Definir

- Precio de suscripción mensual
- Duración período de prueba
- Expansión a otros países (post-validación Chile)
- Lista completa de instrumentos disponibles
- Pantalla de materiales (reservada en navegación)
