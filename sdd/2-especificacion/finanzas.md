# Especificación — Finanzas
> Módulo: `app/(tabs)/finanzas.jsx`

---

## Historia de usuario

**Como** profesor de música,
**quiero** ver mis ingresos del mes, quién me debe, y gestionar los pagos solicitados,
**para** saber cuánto gané, quién no ha pagado, y poder generar/anular/reembolsar cobros sin salir de la pantalla.

---

## Criterios de aceptación

### Resumen del mes

- [ ] Total ingresado: suma de `pagos.monto_total` con `estado = 'pagado'` y `fecha_pago` en el mes visible.
- [ ] Total pendiente: suma de clases con `estado = 'realizada'`, `pagada = false` (incluye las que están en un pago `pendiente` y las que no).
- [ ] Cantidad de clases pagadas en el mes.
- [ ] Cantidad de clases pendientes de pago.
- [ ] El mes visible es el mes actual por defecto. Opcional: selector de mes.
- [ ] Los ingresos de **históricos** (clases pagadas de alumnos/talleres eliminados) se incluyen en el total ingresado. No se cuentan en pendientes (si fue eliminado, ya no se le debe nada).

### Lista por alumno/taller

- [ ] Muestra todos los alumnos y talleres activos con su estado de pago del mes.
- [ ] Por cada uno: nombre, cantidad de clases del mes, monto pagado, monto pendiente.
- [ ] Badge visual:
  - **Al día** (verde): no tiene clases pendientes de pago.
  - **Pendiente** (alerta): tiene clases pendientes sin pago asociado.
  - **Esperando pago** (warning): tiene un pago en estado `pendiente` (link enviado, sin pagar todavía).
- [ ] Presionar → despliega detalle:
  - Lista de clases del mes con su estado (`pagada` / `solicitada` / `por cobrar`).
  - Atajo "Generar pago" (mismo modal que en perfil — ver `pagos-flow.md`). Deshabilitado si no hay clases pagables.

### Sección "Pagos solicitados"

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

### Lo que NO existe más en Finanzas

- ❌ **Toggle manual de pagada/no pagada por clase.** El flag `clases.pagada` ya no es editable directamente por el profesor. Es un efecto del estado del pago asociado (ver `pagos-flow.md`). Si el profesor quiere "des-pagar" una clase, debe reembolsar el pago que la cubrió.
- ❌ Botón "marcar como pagada manualmente" sin pasar por Flow. Si en el futuro se quiere soportar pagos en efectivo, se modelará como un tipo de pago aparte (`metodo_pago = 'efectivo'`) creado por el profesor, no como un toggle.

---

## Restricciones técnicas

- Datos consumidos desde `AlumnosContext`: `alumnos`, `talleres`, `clases`, `pagos`, `pagosHistoricos`.
- `valor_custom` tiene prioridad sobre `valor_unitario` para clases todavía no incluidas en un pago. Para clases ya incluidas en un pago, el monto se lee de `pagos_clases.monto` (snapshot).
- Sin fetch propio a Supabase — consume solo el contexto.
- Las transiciones de estado de pago (anular, reembolsar) se hacen vía mutadores del contexto que llaman Edge Functions de Supabase. El cliente nunca habla con Flow directamente.

---

## Estado actual

- **Implementado:** pantalla base con resumen mensual y lista de alumnos/talleres. Toggle de pagada por clase (a eliminar — ver migración en `4-tareas.md`).
- **Pendiente:**
  - Eliminar toggle manual de pagada y los flujos asociados.
  - Sección "Pagos solicitados" con los 4 grupos por estado.
  - Atajo "Generar pago" en cada tarjeta.
  - Selector de mes.
  - Histórico de eliminados visible.
  - Badge "Esperando pago" (estado nuevo derivado de pagos pendientes).
