// Utilidades de fecha compartidas entre pantallas y notificaciones

export function parseFecha(str) {
  if (!str || typeof str !== 'string') return null;
  const partes = str.split(/[\/\-]/);
  if (partes.length !== 3) return null;
  const [a, b, c] = partes.map(Number);
  if (isNaN(a) || isNaN(b) || isNaN(c)) return null;

  let year, month, day;
  if (c > 999) { year = c; month = b; day = a; }       // DD/MM/YYYY
  else if (a > 999) { year = a; month = b; day = c; }  // YYYY-MM-DD
  else return null;

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 9999) return null;

  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}
