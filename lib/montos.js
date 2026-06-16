// Monto de una clase: fuente única compartida por Finanzas y Cobro (BUG-43).
// Antes cada pantalla lo calculaba con su propia fórmula y podían diferir para
// la misma clase. Prioridad: valor_custom (override de la clase) → valor_unitario
// guardado al crear la clase (fiel al valor de ese momento) → valor por defecto de
// la entidad vigente como último recurso.

export function valorPorDefecto(entidad) {
  if (!entidad) return 0;
  return entidad.tipo === 'taller'
    ? (entidad.valorPorAlumno || 0) * (entidad.participantes?.length || 1)
    : (entidad.valorClase || 0);
}

export function montoDeClase(clase, entidad) {
  return clase.valorCustom ?? (clase.valorUnitario || valorPorDefecto(entidad));
}
