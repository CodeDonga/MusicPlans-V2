# Especificación — Finanzas
> Módulo: `app/(tabs)/finanzas.jsx`

---

## Historia de usuario

**Como** profesor de música,
**quiero** ver mis ingresos del mes, quién me debe, y generar un cobro,
**para** saber cuánto gané, quién no ha pagado, y enviar el detalle de cobro sin salir de la pantalla.

---

## Criterios de aceptación

### Resumen del mes

- [ ] Total ingresado: suma del valor de las clases con `pagada = true` y fecha en el mes visible. *(v1 sin tabla de pagos; con pasarela pasaría a `pagos.monto_total`.)*
- [ ] Total pendiente: suma de clases con `estado = 'realizada'`, `pagada = false`.
- [ ] Cantidad de clases pagadas en el mes.
- [ ] Cantidad de clases pendientes de pago.
- [ ] El mes visible es el mes actual por defecto. Opcional: selector de mes.
- [ ] Los ingresos de **históricos** (clases pagadas de alumnos/talleres eliminados) se incluyen en el total ingresado. No se cuentan en pendientes (si fue eliminado, ya no se le debe nada).

### Lista por alumno/taller

- [ ] Muestra todos los alumnos y talleres activos con su estado de pago del mes.
- [ ] Por cada uno: nombre, cantidad de clases del mes, monto pagado, monto pendiente.
- [ ] Badge visual:
  - **Al día** (verde): no tiene clases pendientes de pago.
  - **Pendiente** (alerta): tiene clases `realizada` con `pagada = false`.
  - ⏸️ *"Esperando pago" (warning): pospuesto — requiere estado persistido de cobro (módulo pasarela).*
- [ ] Presionar → despliega detalle:
  - Lista de clases del mes con su estado (`pagada` / `por cobrar`) y el toggle de pagada.
  - Atajo "Generar cobro" (mismo modal que en perfil — ver `cobro-transferencia.md`). Deshabilitado si no hay clases pagables o faltan datos de cobro.

### Sección "Pagos solicitados" — ⏸️ POSPUESTO (módulo pasarela)

> No aplica a la v1 de cobro manual: no se persisten cobros, así que no hay pagos que agrupar por estado. Se retoma con la pasarela automática. Lo de abajo es diseño de referencia.

- [ ] Pestaña/sección dedicada que lista los pagos del mes agrupados por estado:
  - **Pendientes** (link activo, no pagado todavía).
  - **Pagados** (este mes).
  - **Expirados o anulados** (este mes).
  - **Reembolsados** (este mes).
- [ ] Cada pago muestra: alumno, cantidad de clases, monto, fecha de creación, fecha de expiración (si pendiente), fecha de pago (si pagado).
- [ ] Presionar un pago abre acciones según su estado:
  - `pendiente` → "Compartir link de nuevo", "Anular pago".
  - `pagado` → "Reembolsar", "Ver detalle".
  - Otros estados → solo lectura.

### Histórico de eliminados

- [x] Muestra ingresos de alumnos/talleres eliminados pero con clases pagadas.
- [x] Agrupados por nombre de la entidad eliminada.
- [x] El detalle lista cada clase pagada del mes con su fecha y hora (`DD/MM/YYYY · HH:MMhs`).

### Toggle manual de pagada (v1: se mantiene)

> Revisado 2026-06-13: con el **cobro por transferencia manual** (`cobro-transferencia.md`), el toggle `pagada` por clase **se conserva** y es la fuente de verdad del estado de pago. El profesor lo activa al recibir la transferencia. La eliminación del toggle (y `pagada` como efecto de un pago) sólo aplicaría si se implementa la pasarela automática (módulo POSPUESTO).

---

## Restricciones técnicas

- Datos consumidos desde `AlumnosContext`: `alumnos`, `talleres`, `clases`, `pagosHistoricos`.
- `valor_custom` tiene prioridad sobre `valor_unitario` para el monto de cada clase.
- Sin fetch propio a Supabase — consume solo el contexto.
- v1 sin tabla `pagos` ni Edge Functions de cobro: el estado de pago es el toggle `pagada`.

---

## Estado actual

- **Implementado:** resumen mensual, lista de alumnos/talleres, toggle de pagada por clase (se mantiene), selector de mes (F-04), histórico de eliminados (F-05).
- **Pendiente (v1):**
  - Atajo "Generar cobro" en cada tarjeta (CT-06).
  - Detalle expandible por alumno con toggle + atajo (F-03).
- **Pospuesto (módulo pasarela):** sección "Pagos solicitados", badge "Esperando pago".
