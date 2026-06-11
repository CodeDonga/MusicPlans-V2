# Especificación — Pagos (Flow)
> Estado: PENDIENTE DE IMPLEMENTACIÓN
> Módulos a crear: `app/(tabs)/perfil.jsx` (modal), `app/pago/[token].jsx` (vista pública), Edge Function webhook, tabla `pagos` + `pagos_clases` en Supabase.

---

## Historia de usuario

**Como** profesor de música,
**quiero** generar un link de pago con las clases que el alumno me debe,
**para** que pague online sin transferencias manuales ni efectivo, y que la app marque sus clases como pagadas automáticamente.

**Como** alumno de música,
**quiero** pagar mis clases desde un link que me llega por WhatsApp,
**para** no tener que descargar una app ni crear cuenta.

---

## Decisiones de diseño (cerradas)

1. **Granularidad:** un pago cubre **varias clases** del mismo alumno/taller. El profesor selecciona qué clases incluir.
2. **Disparador:** **manual por el profesor** (no automático). El profesor decide cuándo y a quién cobrar.
3. **Comisión Flow (~2,9% + IVA):** la **absorbe el profesor**. El alumno paga exactamente el monto de las clases. El profesor recibe `monto − comisión`.
4. **Autenticación del alumno:** **link público sin login**. La URL contiene un token opaco e impredecible.
5. **Expiración:** un pago en estado `pendiente` expira a los **7 días** de creado. Al expirar, las clases se liberan para ser incluidas en otro pago.

---

## Modelo de datos

### Tabla `pagos` (nueva)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK auth.users — el profesor |
| `entidad_id` | uuid | alumno o taller que paga |
| `entidad_tipo` | text | `'alumno'` o `'taller'` |
| `entidad_nombre` | text | desnormalizado para histórico |
| `monto_total` | integer | CLP, suma de las clases incluidas al momento de generar |
| `estado` | text | `pendiente` / `pagado` / `expirado` / `anulado` / `reembolsado` |
| `token` | text | UUID v4, identifica el link público |
| `flow_token` | text | nullable, token devuelto por Flow al crear el cobro |
| `flow_url` | text | nullable, URL de Flow a la que redirigir al alumno |
| `metodo_pago` | text | nullable, lo informa Flow al confirmar (`tarjeta`, `transferencia`, …) |
| `fecha_creacion` | timestamptz | |
| `fecha_expiracion` | timestamptz | `fecha_creacion + 7 días` |
| `fecha_pago` | timestamptz | nullable, fecha de confirmación de Flow |
| `fecha_cierre` | timestamptz | nullable, momento en que pasó a anulado/reembolsado |

### Tabla `pagos_clases` (nueva, join many-to-many)

| Columna | Tipo | Notas |
|---|---|---|
| `pago_id` | uuid | FK `pagos.id`, ON DELETE CASCADE |
| `clase_id` | uuid | FK `clases.id`, ON DELETE CASCADE |
| `monto` | integer | valor de la clase al momento de incluirla (snapshot de `valor_custom ?? valor_unitario`) |

**PK compuesta:** `(pago_id, clase_id)`.

### Cambios en tabla `clases`

- `pagada` (boolean) **se mantiene** como cache derivado del estado de pagos. No se modifica manualmente: cambia solo como efecto de transiciones de `pagos.estado`.

### Invariante: una clase no puede tener dos pagos no-finales

Una `clase_id` puede aparecer en `pagos_clases` apuntando a múltiples pagos a lo largo del tiempo (uno expiró, otro nuevo se generó), pero solo **uno de esos pagos puede estar en estado `pendiente` o `pagado`** al mismo tiempo. Esto se valida en la lógica de creación de pago.

---

## Máquina de estados del pago

```
                    ┌────────────────┐
                    │   pendiente    │ ← estado inicial al crear
                    └───────┬────────┘
        ┌───────────────────┼─────────────────┐
        ▼                   ▼                 ▼
   ┌─────────┐         ┌─────────┐       ┌─────────┐
   │ pagado  │         │expirado │       │ anulado │
   └────┬────┘         └─────────┘       └─────────┘
        ▼
   ┌──────────────┐
   │ reembolsado  │
   └──────────────┘
```

| Transición | Disparador | Efecto sobre `clases.pagada` |
|---|---|---|
| `→ pendiente` | profesor genera pago | sin efecto |
| `pendiente → pagado` | webhook Flow (cobro exitoso) | todas las clases asociadas: `pagada = true` |
| `pendiente → expirado` | cron / lectura perezosa después de 7 días | sin efecto (siguen `pagada = false`) |
| `pendiente → anulado` | profesor anula manualmente | sin efecto |
| `pagado → reembolsado` | profesor inicia reembolso | todas las clases asociadas: `pagada = false` |

Estados `pagado`, `expirado`, `anulado`, `reembolsado` son **terminales** (no se vuelven a transicionar).

---

## Criterios de aceptación

### Profesor — botón "Generar pago"

- [ ] En el perfil del alumno (`app/(tabs)/perfil.jsx`), debajo de "Editar" y "Eliminar", aparece un tercer botón **"Generar pago"** con estilo primario.
- [ ] El mismo botón aparece en el perfil del taller.
- [ ] En Finanzas (`app/(tabs)/finanzas.jsx`), cada tarjeta de alumno/taller con badge "Pendiente" muestra acceso directo al mismo modal (atajo, mismo flujo).
- [ ] El botón "Generar pago" está **deshabilitado** (gris) si el alumno no tiene ninguna clase realizada pendiente de pago y sin pago pendiente asociado.

### Profesor — modal de selección de clases

- [ ] Al presionar "Generar pago", se abre un modal con:
  - Título: "Generar pago para {nombre}".
  - Lista de clases del alumno con estado `realizada`, `pagada = false`, ordenadas por fecha descendente.
  - Cada fila: checkbox + fecha (`DD/MM/YYYY`) + hora + monto unitario (`$X.XXX`).
  - Las clases que ya tienen un pago en estado `pendiente` aparecen marcadas como "Ya solicitada" (badge gris) y **no son seleccionables**.
- [ ] **Default:** todas las clases pagables están preseleccionadas.
- [ ] Pie del modal: "Total a cobrar: $XX.XXX" (suma viva según selección).
- [ ] Dos botones: **"Cancelar"** (cierra el modal sin efectos) y **"Generar pago"** (primario, deshabilitado si no hay ninguna clase seleccionada).
- [ ] Al presionar "Generar pago":
  1. Se llama a la API de Flow para crear el cobro (server-side, vía Edge Function).
  2. Se inserta una fila en `pagos` con estado `pendiente`, `monto_total` = suma de seleccionadas, `flow_url` y `flow_token` devueltos por Flow.
  3. Se insertan filas en `pagos_clases` para cada clase seleccionada con su `monto` snapshot.
  4. Se navega a una pantalla **"Link generado"**.
- [ ] Si la creación falla (error de red, Flow rechaza, alguna clase fue tocada en paralelo) → Alert con el error y el modal sigue abierto.

### Profesor — pantalla "Link generado"

- [ ] Muestra: confirmación visual (✓), nombre del alumno, total cobrado, lista compacta de clases incluidas, fecha de expiración (`Expira el DD/MM`).
- [ ] Dos botones:
  - **"Compartir por WhatsApp"** → abre WhatsApp con mensaje predefinido:
    > "Hola {nombre}, te dejo el link para pagar tus clases de música: {url}. Total: $XX.XXX. Vence el DD/MM."
  - **"Copiar link"** → copia al portapapeles + toast "Link copiado".
- [ ] Botón secundario "Listo" → vuelve al perfil.

### Profesor — gestión de pagos existentes (en Finanzas)

- [ ] Sección "Pagos solicitados" dentro de Finanzas, agrupada por estado: Pendientes / Pagados (este mes) / Expirados o anulados (este mes).
- [ ] Cada pago muestra: nombre alumno, cantidad de clases, monto, fecha de creación, fecha de expiración, estado.
- [ ] Presionar un pago pendiente → acciones disponibles: "Compartir link de nuevo", "Anular pago".
- [ ] Anular pago → Alert: "¿Anular esta solicitud? Las clases quedarán pendientes de pago." Botones: Cancelar | Anular.
  - Al confirmar: estado pasa a `anulado`, las clases asociadas quedan libres para otro pago.
  - Si Flow soporta cancelar la orden remotamente, se llama; si ya no es cancelable (timeout), solo se marca local.
- [ ] Presionar un pago pagado → muestra detalle + acción "Reembolsar".
- [ ] Reembolsar → Alert: "¿Reembolsar este pago? Se devuelve el dinero al alumno y las clases vuelven a pendientes de pago." Botones: Cancelar | Reembolsar.
  - Al confirmar: llama API Flow para reembolso, estado pasa a `reembolsado`, clases asociadas: `pagada = false`, sus estados se mantienen (`realizada` sigue `realizada`).

### Alumno — vista pública del link

- [ ] Ruta pública: `app/pago/[token].jsx` (debe funcionar en web — Expo Router web build).
- [ ] No requiere login.
- [ ] Carga el pago por token. Si no existe → "Link inválido o expirado".
- [ ] Si `estado != pendiente`:
  - `pagado` → "Este pago ya fue procesado el DD/MM. ✓"
  - `expirado` → "Este link expiró el DD/MM. Pídele a tu profesor uno nuevo."
  - `anulado` → "Este link fue cancelado por el profesor."
  - `reembolsado` → "Este pago fue reembolsado."
- [ ] Si `estado == pendiente`:
  - Muestra: nombre del profesor, nombre del alumno, lista de clases (fecha + monto), total, fecha de expiración.
  - Botón primario **"Pagar con Flow"** → redirige a `flow_url`.
  - Respeta tema oscuro/claro de MusicPlans (paleta de la constitución).

### Webhook — confirmación de pago

- [ ] Edge Function en Supabase con URL pública estable (configurada en el panel de Flow).
- [ ] Recibe POST de Flow con `token` (el `flow_token`) y firma.
- [ ] Valida la firma con el secret compartido con Flow. Si inválida → 401.
- [ ] Llama GET a Flow `/payment/getStatus` para confirmar el estado real (no confiar solo en el POST).
- [ ] Si Flow confirma pagado:
  1. Busca `pagos` por `flow_token`.
  2. Idempotencia: si ya está en `pagado`, retorna 200 sin reprocesar.
  3. Si está en `pendiente`: transiciona a `pagado`, escribe `fecha_pago`, `metodo_pago`.
  4. Actualiza `clases.pagada = true` para todas las clases asociadas.
  5. Inserta notificación push al `user_id` (profesor): "{Alumno} pagó $XX.XXX por N clases".
- [ ] Si Flow informa que el pago no se completó → no transiciona, retorna 200.
- [ ] Errores no controlados → 500 + log.

### Expiración

- [ ] Estrategia: **lectura perezosa**. Cualquier consulta a `pagos` con `estado = pendiente` y `fecha_expiracion < now()` transiciona el pago a `expirado` antes de devolverlo.
- [ ] Se implementa como vista SQL o como step en el query del cliente. No se requiere cron al inicio.
- [ ] La vista pública del link en estado `pendiente` pero vencido renderiza el mensaje de expirado.

---

## Restricciones técnicas

- **Cuenta Flow:** requiere cuenta comercial activa en Chile. Credenciales (`apiKey`, `secretKey`) en variables de entorno del backend; **nunca** en el cliente.
- **Cliente nunca llama Flow directamente.** Todas las llamadas a Flow (crear orden, consultar estado, reembolsar, anular) van por Edge Functions de Supabase para proteger la `secretKey`.
- **Moneda:** CLP (entero, sin decimales).
- **URL base de los links:** dominio del proyecto (por definir). Ej: `https://musicplans.cl/pago/{token}`. Mientras no haya dominio, usar URL de Supabase + ruta de Edge Function que sirva la página.
- **RLS de `pagos`:**
  - `SELECT`: el profesor lee los suyos (`user_id = auth.uid()`). La vista pública por token usa una Edge Function con `service_role` que filtra por token (no expone otros pagos).
  - `INSERT/UPDATE/DELETE`: solo `user_id = auth.uid()`.
- **RLS de `pagos_clases`:** hereda permisos vía el `pago_id`.
- **Snapshot de monto:** `pagos_clases.monto` se guarda al momento de crear el pago. Si después el profesor cambia `valor_custom` de la clase, no afecta pagos ya generados.

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Profesor borra una clase incluida en un pago `pendiente` | La fila de `pagos_clases` cae por CASCADE. Si el pago se queda sin clases, transiciona automáticamente a `anulado` (`fecha_cierre = now()`). |
| Profesor borra una clase incluida en un pago `pagado` | La clase se borra pero el pago **no se modifica**. Queda como pago histórico de una clase que ya no existe (igual que `pagosHistoricos` hoy). El `entidad_nombre` desnormalizado preserva trazabilidad. |
| Alumno paga después de los 7 días | Flow no debería permitirlo si seteamos expiración en su lado, pero como salvaguarda: el webhook compara `fecha_pago` con `fecha_expiracion`. Si llegó tarde y nuestro estado ya es `expirado`, se acepta igual (el dinero llegó), se transiciona a `pagado` y se loguea como caso anómalo. |
| Alumno paga dos veces el mismo link | Flow no permite cobrar dos veces la misma orden. El segundo intento falla del lado de Flow. |
| Profesor genera pago, pero Flow está caído | El INSERT en `pagos` no ocurre. El profesor ve Alert "No pudimos generar el link, intentá de nuevo". |
| Webhook llega antes de que termine el INSERT de `pagos` | Improbable (latencia humana entre crear y pagar es >> que la latencia DB), pero el webhook hace retry con backoff si no encuentra el pago. |
| Reembolso parcial | **No soportado en v1.** O se reembolsa todo o no se reembolsa. |

---

## Por definir (futuro)

- Notificación push al alumno cuando vence el link (requiere algún canal — WhatsApp Business API o email).
- Reembolso parcial.
- Pagos recurrentes / suscripción mensual.
- Dashboard de conversión (cuántos links generados terminan en pagos).
