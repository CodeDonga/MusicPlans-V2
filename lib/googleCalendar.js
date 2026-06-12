import { parseFecha } from './fechas';

const API = 'https://www.googleapis.com/calendar/v3';

function getLocalTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function buildEventTimes(fecha, hora) {
  const date = parseFecha(fecha);
  if (!date || !hora) return null;
  const [hh, mm] = hora.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: fmt(start), end: fmt(end) };
}

function buildBody(clase, entidadNombre) {
  const times = buildEventTimes(clase.fecha, clase.hora);
  if (!times) return null;
  const tz = getLocalTimeZone();
  const partes = [];
  if (clase.planificacion) partes.push(`📋 Planificación:\n${clase.planificacion}`);
  if (clase.tareas) partes.push(`✅ Tarea:\n${clase.tareas}`);
  return {
    summary: `🎵 Clase: ${entidadNombre}`,
    description: partes.join('\n\n'),
    start: { dateTime: times.start, timeZone: tz },
    end: { dateTime: times.end, timeZone: tz },
  };
}

export async function crearEvento(accessToken, clase, entidadNombre) {
  if (!accessToken) return null;
  const body = buildBody(clase, entidadNombre);
  if (!body) return null;
  try {
    const res = await fetch(`${API}/calendars/primary/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error('TOKEN_EXPIRADO');
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch (e) {
    if (e.message === 'TOKEN_EXPIRADO') throw e;
    return null;
  }
}

export async function editarEvento(accessToken, googleEventId, clase, entidadNombre) {
  if (!accessToken || !googleEventId) return;
  const body = buildBody(clase, entidadNombre);
  if (!body) return;
  try {
    const res = await fetch(`${API}/calendars/primary/events/${googleEventId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error('TOKEN_EXPIRADO');
  } catch (e) {
    if (e.message === 'TOKEN_EXPIRADO') throw e;
  }
}

export async function eliminarEvento(accessToken, googleEventId) {
  if (!accessToken || !googleEventId) return false;
  try {
    const res = await fetch(`${API}/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401) throw new Error('TOKEN_EXPIRADO');
    // 404/410: el evento ya no existe en Calendar — objetivo cumplido
    if (res.ok || res.status === 404 || res.status === 410) return true;
    if (__DEV__) console.warn(`[gcal] DELETE evento ${googleEventId} falló con status ${res.status}`);
    return false;
  } catch (e) {
    if (e.message === 'TOKEN_EXPIRADO') throw e;
    if (__DEV__) console.warn('[gcal] DELETE evento falló:', e.message);
    return false;
  }
}
