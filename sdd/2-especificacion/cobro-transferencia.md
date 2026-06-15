# Especificación — Cobro por transferencia (v1)

> Estado: PENDIENTE DE IMPLEMENTACIÓN
> Reemplaza a `pagos-flow.md` como mecanismo de cobro de la v1. La pasarela
> automática (Khipu) queda **pospuesta** como mejora futura — ver `pagos-flow.md`
> (renombrable a `pagos-khipu.md`) y la nota al final.

---

## Historia de usuario

**Como** profesor de música,
**quiero** generar un mensaje de cobro con mis datos bancarios, el detalle de las clases y el monto exacto,
**para** enviárselo al alumno por WhatsApp, que transfiera, y luego marcar esas clases como pagadas.

**Como** alumno de música,
**quiero** recibir por WhatsApp el monto exacto y los datos de transferencia,
**para** pagar por transferencia bancaria sin apps ni cuentas nuevas.

---

## Decisiones de diseño (cerradas)

1. **Sin pasarela.** El cobro es una **transferencia bancaria manual** entre alumno y profesor. La app no mueve dinero ni se entera del pago automáticamente.
2. **La app asiste, no concilia.** Arma el mensaje (monto exacto + detalle + datos bancarios) y abre WhatsApp. La confirmación del pago es **manual**: el profesor marca las clases como pagadas con el toggle existente (AL-14/AL-17) cuando recibe la transferencia.
3. **El toggle manual de `pagada` se mantiene** (revierte AL-18, PF-21/22). `clases.pagada` sigue siendo editable por el profesor: es la fuente de verdad del estado de pago en v1.
4. **Sin estado persistido de "cobro enviado".** No hay tabla de cobros ni badge "esperando pago" en v1: generar el mensaje no deja rastro en la DB. (Si se quisiera, es una mejora futura — ver abajo.)
5. **Datos bancarios del profesor** se guardan en `user_metadata.datos_cobro` (objeto), igual que `nombre`. Son datos del propio profesor, editables por él. *(Alternativa evaluada: tabla con RLS; se descarta para v1 por simplicidad, sin migración.)*

---

## Modelo de datos

**No requiere tablas nuevas.** Reusa:
- `clases.pagada`, `clases.estado`, `valor_custom`/`valor_unitario` (montos).
- `alumnos.whatsapp` (destino del mensaje).
- `user_metadata.datos_cobro`: `{ titular, rut, banco, tipo_cuenta, numero_cuenta, email }`.

---

## Criterios de aceptación

### Ajustes — datos de cobro

- [ ] Nueva sección "Datos de cobro" en Ajustes (`app/(tabs)/ajustes.jsx`).
- [ ] Formulario: **Titular**, **RUT**, **Banco**, **Tipo de cuenta** (corriente / vista / ahorro), **N° de cuenta**, **Email** (opcional).
- [ ] Persisten en `user_metadata.datos_cobro` vía `AuthContext` (mismo patrón que `updatePerfil`).
- [ ] Validación inline de campos obligatorios (titular, rut, banco, tipo, número).
- [ ] Mientras no estén configurados, los botones "Generar cobro" aparecen deshabilitados con una pista ("Configura tus datos de cobro en Ajustes").

### Profesor — botón "Generar cobro"

- [ ] En el perfil del alumno (`perfil.jsx`), debajo de "Editar" y "Eliminar", un botón **"Generar cobro"** (estilo primario).
- [ ] El mismo botón en el perfil del taller.
- [ ] En Finanzas, cada tarjeta con badge "Pendiente" tiene un atajo al mismo flujo.
- [ ] **Deshabilitado** si: el profesor no configuró datos de cobro, **o** el alumno no tiene clases `realizada` con `pagada = false`.

### Profesor — modal de selección de clases

- [ ] Al presionar "Generar cobro", se abre un modal:
  - Título: "Cobrar a {nombre}".
  - Lista de clases `realizada` + `pagada = false`, ordenadas por fecha descendente.
  - Cada fila: checkbox + fecha (`DD/MM/YYYY`) + hora + monto (`$X.XXX`, usando `valor_custom ?? valor_unitario`).
  - **Default:** todas preseleccionadas.
  - Pie: "Total a cobrar: $XX.XXX" (suma viva según selección).
  - Botones: **"Cancelar"** y **"Generar mensaje"** (primario, deshabilitado si no hay ninguna seleccionada).

### Profesor — mensaje de WhatsApp

- [ ] "Generar mensaje" arma un texto y abre WhatsApp al número del alumno (`alumnos.whatsapp`) con el texto prellenado, vía `Linking` (`whatsapp://send?phone=...&text=...`, fallback `https://wa.me/...`).
- [ ] Plantilla del mensaje:
  > Hola {nombre} 👋. Te paso el detalle de tus clases de música:
  > • {DD/MM} — $X.XXX
  > • {DD/MM} — $X.XXX
  > *Total: $XX.XXX*
  >
  > Puedes transferir a:
  > {titular} — RUT {rut}
  > {banco}, cuenta {tipo} N° {numero}
  > {email}
  >
  > Cuando transfieras, envíame el comprobante 🙌
- [ ] Si el alumno no tiene WhatsApp cargado → abre WhatsApp sin destinatario (o avisa), pero igual arma el texto para copiar/compartir.
- [ ] El flujo **no cambia ningún estado**: no marca clases pagadas ni persiste nada.

### Confirmación del pago (manual, ya existente)

- [ ] El profesor marca las clases como pagadas con el toggle existente (AL-14/AL-17) al recibir la transferencia. Sin cambios respecto al comportamiento actual.

---

## Restricciones técnicas

- **Sin Edge Functions, sin webhook, sin vista pública, sin tabla de pagos.** Todo ocurre en el cliente reusando el contexto y `user_metadata`.
- **Moneda:** CLP (entero, sin decimales).
- Los datos de cobro viven en `user_metadata` del profesor (legibles solo por él vía su sesión).
- La construcción del mensaje debe URL-encodear el texto para el deep link de WhatsApp.

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Profesor sin datos de cobro configurados | Botón "Generar cobro" deshabilitado + pista hacia Ajustes. |
| Alumno sin clases pagables | Botón deshabilitado. |
| Alumno sin WhatsApp cargado | Se arma el texto igual; se abre WhatsApp sin número o se ofrece compartir/copiar. |
| Profesor cobra dos veces las mismas clases | Posible (no hay estado): es responsabilidad del profesor. El toggle `pagada` evita re-cobrar (las pagadas ya no aparecen en el modal). |
| El alumno transfiere de menos / no transfiere | Fuera del alcance de la app: el profesor simplemente no marca las clases como pagadas. |

---

## Mejora futura: pasarela automática (Khipu)

Investigado el 2026-06-13: la API v3 de Khipu cubre crear pago, consultar estado, webhook firmado (HMAC `x-khipu-signature`), anular pendientes y reembolsar (con la salvedad de que el refund por API solo opera antes de la liquidación de fondos, 24–72h). Comisión ~0,69–1,5% (la absorbería el profesor), solo transferencia bancaria. La spec completa de la pasarela está en `pagos-flow.md` (a reescribir contra Khipu cuando se retome). Esta v1 de cobro manual **no cierra la puerta**: la pasarela se suma encima sin rehacer lo de aquí.
