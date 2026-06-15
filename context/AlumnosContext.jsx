import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { parseFecha } from '../lib/fechas';
import { programarNotificacion, cancelarNotificacion } from '../lib/notificaciones';
import { crearEvento, editarEvento, eliminarEvento } from '../lib/googleCalendar';
import { logWarn } from '../lib/log';

const AlumnosContext = createContext(null);

export function AlumnosProvider({ children }) {
  const { session, getCalendarAccessToken, clearProviderToken } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [clases, setClases] = useState({});
  const [pagosHistoricos, setPagosHistoricos] = useState([]);
  const userIdRef = useRef(null);
  // ARQ-15: contador de mutaciones en vuelo. El listener de AppState no recarga
  // mientras haya una operación activa, para no pisar estado optimista (familia BUG-29).
  const mutacionesEnCurso = useRef(0);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (userId) {
      userIdRef.current = userId;
      cargarDatos();
    } else {
      userIdRef.current = null;
      setAlumnos([]);
      setTalleres([]);
      setClases({});
      setPagosHistoricos([]);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && userIdRef.current && mutacionesEnCurso.current === 0) cargarDatos();
    });
    return () => sub.remove();
  }, []);

  async function cargarDatos() {
    const userId = userIdRef.current;
    if (!userId) return;
    const [
      { data: aData, error: aErr },
      { data: tData, error: tErr },
      { data: cData, error: cErr },
    ] = await Promise.all([
      supabase.from('alumnos').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('talleres').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('clases').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    if (aErr || tErr || cErr) return;

    const todasIds = new Set([
      ...(aData || []).map(a => a.id),
      ...(tData || []).map(t => t.id),
    ]);

    const alumnosMapped = (aData || []).map(dbToAlumno);
    const talleresMapped = (tData || []).map(row => dbToTaller(row, alumnosMapped));

    setAlumnos(alumnosMapped);
    setTalleres(talleresMapped);

    const mapa = {};
    const historico = {};

    (cData || []).forEach(c => {
      if (todasIds.has(c.entidad_id)) {
        if (!mapa[c.entidad_id]) mapa[c.entidad_id] = [];
        mapa[c.entidad_id].push(dbToClase(c));
      } else if (c.pagada) {
        if (!historico[c.entidad_id]) {
          historico[c.entidad_id] = {
            nombre: c.entidad_nombre || 'Eliminado',
            valorUnitario: c.valor_unitario || 0,
            clases: [],
          };
        }
        historico[c.entidad_id].clases.push(dbToClase(c));
      }
    });

    setClases(mapa);
    setPagosHistoricos(Object.values(historico));
  }

  // --- Mappers DB ↔ App ---

  function dbToAlumno(row) {
    return {
      id: row.id,
      nombre: row.nombre,
      instrumento: row.instrumento,
      avatar: row.avatar,
      whatsapp: row.whatsapp,
      valorClase: row.valor_clase,
      diaSemana: row.dia_semana,
      hora: row.hora,
      tipo: row.tipo,
    };
  }

  function alumnoToDB(alumno) {
    return {
      user_id: userIdRef.current,
      nombre: alumno.nombre,
      instrumento: alumno.instrumento,
      avatar: alumno.avatar,
      whatsapp: alumno.whatsapp,
      valor_clase: alumno.valorClase,
      dia_semana: alumno.diaSemana,
      hora: alumno.hora,
      tipo: 'alumno',
    };
  }

  function extraerIds(arr) {
    return (arr || []).map(p => typeof p === 'string' ? p : p?.id).filter(Boolean);
  }

  function dbToTaller(row, alumnosList = alumnos) {
    const ids = extraerIds(row.participantes);
    const participantesHidratados = ids.map(pid => {
      const a = alumnosList.find(x => x.id === pid);
      return { id: pid, nombre: a?.nombre || 'Alumno eliminado' };
    });
    return {
      id: row.id,
      nombre: row.nombre,
      instrumento: row.instrumento,
      avatar: row.avatar,
      valorPorAlumno: row.valor_por_alumno,
      diaSemana: row.dia_semana,
      hora: row.hora,
      tipo: row.tipo,
      participantes: participantesHidratados,
    };
  }

  function tallerToDB(taller) {
    return {
      user_id: userIdRef.current,
      nombre: taller.nombre,
      instrumento: taller.instrumento,
      avatar: taller.avatar,
      valor_por_alumno: taller.valorPorAlumno,
      dia_semana: taller.diaSemana,
      hora: taller.hora,
      tipo: 'taller',
      participantes: extraerIds(taller.participantes),
    };
  }

  async function getGoogleToken() {
    return await getCalendarAccessToken();
  }

  async function safeGCal(fn) {
    try { return await fn(); }
    catch (e) {
      // GC-05: se invalida el caché y la próxima operación refresca sola
      if (e.message === 'TOKEN_EXPIRADO') clearProviderToken();
      else logWarn('gcal', 'operación de Calendar falló', { error: e?.message });
      return null;
    }
  }

  function dbToClase(row) {
    return {
      id: row.id,
      fecha: row.fecha,
      hora: row.hora,
      planificacion: row.planificacion,
      tareas: row.tareas,
      estado: row.estado,
      pagada: row.pagada || false,
      entidadNombre: row.entidad_nombre || '',
      valorUnitario: row.valor_unitario || 0,
      valorCustom: row.valor_custom ?? null,
      googleEventId: row.google_event_id ?? null,
    };
  }

  async function persistirEventoId(claseId, googleEventId) {
    const { error } = await supabase
      .from('clases')
      .update({ google_event_id: googleEventId })
      .eq('id', claseId);
    if (error) logWarn('gcal', 'no se pudo persistir google_event_id', { error: error.message, claseId });
    return !error;
  }

  function setEventoIdEnMemoria(entidadId, claseId, googleEventId) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseId ? { ...c, googleEventId } : c),
    }));
  }

  // Núcleo de sincronización de UNA clase con Calendar. Recibe el id actual del
  // evento (idActual, leído de la DB) y devuelve el id que debe quedar guardado:
  //   null     → no debe haber evento (cancelada, o no se pudo crear)
  //   idActual → ya existía y sigue igual
  //   nuevo    → se creó o recreó
  // Solo llama a la API (vía safeGCal); no toca DB ni estado.
  async function aplicarEventoDeClase(token, clase, entidad, idActual) {
    const nombre = entidad?.nombre || '';
    if (clase.estado === 'cancelada') {
      if (idActual) await safeGCal(() => eliminarEvento(token, idActual));
      return null;
    }
    if (idActual) {
      const r = await safeGCal(() => editarEvento(token, idActual, clase, nombre));
      if (r !== 'gone') return idActual; // existe (o error transitorio) → no recrear
    }
    return (await safeGCal(() => crearEvento(token, clase, nombre))) ?? idActual;
  }

  // Única vía por la que los mutadores tocan Calendar: lleva el evento de una clase
  // al estado que dicta su `estado` y persiste el google_event_id resultante en DB
  // y en memoria. La DB es la fuente de verdad del id (BUG-29).
  async function reflejarClaseEnCalendar(entidadId, clase, entidad) {
    const token = await getGoogleToken();
    if (!token) return;
    const idActual = await eventoIdDesdeDB(clase.id);
    const idNuevo = await aplicarEventoDeClase(token, clase, entidad, idActual);
    if (idNuevo !== idActual) {
      await persistirEventoId(clase.id, idNuevo);
      setEventoIdEnMemoria(entidadId, clase.id, idNuevo);
    }
  }

  // BUG-29: el google_event_id se lee siempre de la DB (fuente de verdad) antes de
  // borrar/cancelar — el estado en memoria puede no tener el id (p. ej. recargado
  // desde la DB antes de que la persistencia del id terminara)
  async function eventoIdDesdeDB(claseId) {
    const { data } = await supabase
      .from('clases')
      .select('google_event_id')
      .eq('id', claseId)
      .maybeSingle();
    return data?.google_event_id ?? null;
  }

  async function conEventosDeDB(clasesLocales, entidadId) {
    const { data } = await supabase
      .from('clases')
      .select('id, google_event_id')
      .eq('entidad_id', entidadId);
    const eventos = new Map((data || []).map(f => [f.id, f.google_event_id]));
    return clasesLocales.map(c => ({ ...c, googleEventId: eventos.get(c.id) ?? c.googleEventId }));
  }

  // ARQ-16: borra las clases no pagadas de una entidad chequeando el error.
  // Devuelve false si algún delete falló (el caller aborta para no dejar huérfanas).
  async function borrarClasesNoPagadas(entidadId) {
    const { error: e1 } = await supabase.from('clases').delete().eq('entidad_id', entidadId).eq('pagada', false);
    const { error: e2 } = await supabase.from('clases').delete().eq('entidad_id', entidadId).is('pagada', null);
    const error = e1 || e2;
    if (error) logWarn('db', 'no se pudieron borrar clases no pagadas', { error: error.message, entidadId });
    return !error;
  }

  async function limpiarClasesBorradas(clasesBorradas) {
    clasesBorradas.forEach(c => cancelarNotificacion(c.id));
    const conEvento = clasesBorradas.filter(c => c.googleEventId);
    if (conEvento.length === 0) return;
    const token = await getGoogleToken();
    if (!token) return;
    for (const c of conEvento) {
      await safeGCal(() => eliminarEvento(token, c.googleEventId));
    }
  }

  // --- ALUMNOS ---

  async function agregarAlumno(alumno) {
    const tempId = `temp_${Date.now()}`;
    setAlumnos(prev => [...prev, { ...alumno, id: tempId, tipo: 'alumno' }]);

    const { data, error } = await supabase
      .from('alumnos')
      .insert(alumnoToDB(alumno))
      .select()
      .single();

    if (error || !data) {
      setAlumnos(prev => prev.filter(a => a.id !== tempId));
      return { error: error?.message || 'Error desconocido' };
    }
    setAlumnos(prev => prev.map(a => a.id === tempId ? dbToAlumno(data) : a));
    return { id: data.id };
  }

  async function editarAlumno(alumnoActualizado) {
    setAlumnos(prev => prev.map(a => a.id === alumnoActualizado.id ? alumnoActualizado : a));
    const { error } = await supabase
      .from('alumnos')
      .update(alumnoToDB(alumnoActualizado))
      .eq('id', alumnoActualizado.id);
    if (error) cargarDatos();
  }

  async function eliminarAlumno(id) {
    const entidad = alumnos.find(a => a.id === id);
    const clasesPagadas = (clases[id] || []).filter(c => c.pagada);
    // BUG-36: se borran los eventos de Calendar de TODAS las clases (también las
    // pagadas, que se conservan en la DB como historial financiero): un alumno
    // eliminado no debe dejar eventos colgados en el calendario.
    const clasesConEvento = await conEventosDeDB(clases[id] || [], id);

    if (!(await borrarClasesNoPagadas(id))) { cargarDatos(); return; }
    const { error } = await supabase.from('alumnos').delete().eq('id', id);
    if (error) { cargarDatos(); return; }

    await limpiarClasesBorradas(clasesConEvento);

    setAlumnos(prev => prev.filter(a => a.id !== id));
    setClases(prev => { const n = { ...prev }; delete n[id]; return n; });

    if (clasesPagadas.length > 0) {
      setPagosHistoricos(prev => [
        ...prev,
        { nombre: entidad?.nombre || 'Alumno eliminado', valorUnitario: entidad?.valorClase || 0, clases: clasesPagadas },
      ]);
    }
  }

  // --- TALLERES ---

  async function agregarTaller(taller) {
    const tempId = `temp_${Date.now()}`;
    setTalleres(prev => [...prev, { ...taller, id: tempId, tipo: 'taller', participantes: taller.participantes || [] }]);

    const { data, error } = await supabase
      .from('talleres')
      .insert(tallerToDB(taller))
      .select()
      .single();

    if (error || !data) {
      setTalleres(prev => prev.filter(t => t.id !== tempId));
      return { error: error?.message || 'Error desconocido' };
    }
    setTalleres(prev => prev.map(t => t.id === tempId ? dbToTaller(data) : t));
    return { id: data.id };
  }

  async function editarTaller(tallerActualizado) {
    setTalleres(prev => prev.map(t => t.id === tallerActualizado.id ? tallerActualizado : t));
    const { error } = await supabase
      .from('talleres')
      .update(tallerToDB(tallerActualizado))
      .eq('id', tallerActualizado.id);
    if (error) cargarDatos();
  }

  async function eliminarTaller(id) {
    const entidad = talleres.find(t => t.id === id);
    const clasesPagadas = (clases[id] || []).filter(c => c.pagada);
    // BUG-36: ver eliminarAlumno — se limpian los eventos de TODAS las clases.
    const clasesConEvento = await conEventosDeDB(clases[id] || [], id);
    const valorUnitario = (entidad?.valorPorAlumno || 0) * (entidad?.participantes?.length || 1);

    if (!(await borrarClasesNoPagadas(id))) { cargarDatos(); return; }
    const { error } = await supabase.from('talleres').delete().eq('id', id);
    if (error) { cargarDatos(); return; }

    await limpiarClasesBorradas(clasesConEvento);

    setTalleres(prev => prev.filter(t => t.id !== id));
    setClases(prev => { const n = { ...prev }; delete n[id]; return n; });

    if (clasesPagadas.length > 0) {
      setPagosHistoricos(prev => [
        ...prev,
        { nombre: entidad?.nombre || 'Taller eliminado', valorUnitario, clases: clasesPagadas },
      ]);
    }
  }

  // --- CLASES ---

  async function agregarClase(entidadId, clase) {
    const tempId = `temp_${Date.now()}`;
    setClases(prev => ({
      ...prev,
      [entidadId]: [{ ...clase, id: tempId }, ...(prev[entidadId] || [])],
    }));

    const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
    const entidadTipo = entidad?.tipo || 'alumno';
    const valorUnitario = entidad?.tipo === 'taller'
      ? (entidad.valorPorAlumno || 0) * (entidad.participantes?.length || 1)
      : (entidad?.valorClase || 0);

    const { data, error } = await supabase
      .from('clases')
      .insert({
        user_id: userIdRef.current,
        entidad_id: entidadId,
        entidad_tipo: entidadTipo,
        entidad_nombre: entidad?.nombre || '',
        valor_unitario: valorUnitario,
        valor_custom: clase.valorCustom ?? null,
        fecha: clase.fecha,
        hora: clase.hora,
        planificacion: clase.planificacion,
        tareas: clase.tareas,
        estado: clase.estado || 'pendiente',
      })
      .select()
      .single();

    if (error || !data) {
      setClases(prev => ({
        ...prev,
        [entidadId]: (prev[entidadId] || []).filter(c => c.id !== tempId),
      }));
      return;
    }

    const claseDB = dbToClase(data);
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === tempId ? claseDB : c),
    }));

    if (clase.estado !== 'cancelada') {
      programarNotificacion(data.id, entidad?.nombre || '', clase.fecha, clase.hora);
    }
    await reflejarClaseEnCalendar(entidadId, claseDB, entidad);
  }

  async function editarClase(entidadId, claseActualizada) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseActualizada.id ? claseActualizada : c),
    }));

    const { error } = await supabase.from('clases').update({
      fecha: claseActualizada.fecha,
      hora: claseActualizada.hora,
      planificacion: claseActualizada.planificacion,
      tareas: claseActualizada.tareas,
      estado: claseActualizada.estado,
      valor_custom: claseActualizada.valorCustom ?? null,
    }).eq('id', claseActualizada.id);
    if (error) { cargarDatos(); return; }

    const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
    if (claseActualizada.estado === 'cancelada') cancelarNotificacion(claseActualizada.id);
    else programarNotificacion(claseActualizada.id, entidad?.nombre || '', claseActualizada.fecha, claseActualizada.hora);

    await reflejarClaseEnCalendar(entidadId, claseActualizada, entidad);
  }

  async function eliminarClase(entidadId, claseId) {
    const googleEventId = await eventoIdDesdeDB(claseId);
    const { error } = await supabase.from('clases').delete().eq('id', claseId);
    if (error) return;
    cancelarNotificacion(claseId);
    if (googleEventId) {
      const token = await getGoogleToken();
      if (token) await safeGCal(() => eliminarEvento(token, googleEventId));
      else logWarn('gcal', 'sin token para eliminar evento de clase', { claseId });
    }
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).filter(c => c.id !== claseId),
    }));
  }

  async function cambiarEstadoClase(entidadId, claseId, estado) {
    const clase = (clases[entidadId] || []).find(c => c.id === claseId);
    const estadoPrevio = clase?.estado;
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseId ? { ...c, estado } : c),
    }));
    const { error } = await supabase.from('clases').update({ estado }).eq('id', claseId);
    if (error) { cargarDatos(); return; }

    const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
    if (estado === 'cancelada') cancelarNotificacion(claseId);
    else if (estadoPrevio === 'cancelada' && clase) {
      programarNotificacion(claseId, entidad?.nombre || '', clase.fecha, clase.hora);
    }
    // El evento solo cambia de presencia al cancelar (se borra) o al reactivar una
    // cancelada (se recrea); el resto de transiciones no afecta el evento.
    if (clase && (estado === 'cancelada' || estadoPrevio === 'cancelada')) {
      await reflejarClaseEnCalendar(entidadId, { ...clase, estado }, entidad);
    }
  }

  async function togglePagadaClase(entidadId, claseId, pagada) {
    const clase = (clases[entidadId] || []).find(c => c.id === claseId);
    const promoverARealizada = pagada && clase?.estado !== 'realizada';
    const revertirAPendiente = !pagada && clase?.estado === 'realizada';
    const nuevoEstado = promoverARealizada ? 'realizada' : revertirAPendiente ? 'pendiente' : null;

    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c =>
        c.id === claseId ? { ...c, pagada, ...(nuevoEstado ? { estado: nuevoEstado } : {}) } : c
      ),
    }));
    const dbUpdate = { pagada };
    if (nuevoEstado) dbUpdate.estado = nuevoEstado;
    const { error } = await supabase.from('clases').update(dbUpdate).eq('id', claseId);
    if (error) cargarDatos();

    if (promoverARealizada) cancelarNotificacion(claseId);
    if (revertirAPendiente && clase) {
      const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
      programarNotificacion(claseId, entidad?.nombre || '', clase.fecha, clase.hora);
    }
  }

  async function sincronizarClasesExistentes() {
    const token = await getGoogleToken();
    if (!token) return 0;

    const { data: filasDB } = await supabase
      .from('clases')
      .select('id, google_event_id')
      .eq('user_id', userIdRef.current);
    const eventosDB = new Map((filasDB || []).map(f => [f.id, f.google_event_id]));

    const actualizaciones = [];

    for (const [entidadId, clasesEntidad] of Object.entries(clases)) {
      const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
      if (!entidad) continue;

      for (const clase of clasesEntidad) {
        if (clase.estado === 'cancelada') continue;
        // BUG-32: se sincronizan también las clases pasadas — debe aparecer todo el historial.
        if (!parseFecha(clase.fecha)) continue;

        // BUG-29/33: la DB es la única fuente de verdad del id (no el id en memoria).
        const idDB = eventosDB.get(clase.id);

        try {
          if (idDB) {
            // BUG-34: si la clase ya tiene un id, verificar que el evento siga
            // existiendo en Calendar. editarEvento devuelve 'gone' (404/410) si el
            // usuario lo borró → se recrea; si existe, se actualiza y se salta.
            const r = await editarEvento(token, idDB, clase, entidad.nombre);
            if (r !== 'gone') continue;
          }
          const googleEventId = await crearEvento(token, clase, entidad.nombre);
          if (googleEventId) {
            await persistirEventoId(clase.id, googleEventId);
            actualizaciones.push({ entidadId, claseId: clase.id, googleEventId });
          }
        } catch (e) {
          if (e.message === 'TOKEN_EXPIRADO') {
            clearProviderToken();
            return actualizaciones.length;
          }
        }
      }
    }

    if (actualizaciones.length > 0) {
      setClases(prev => {
        const next = { ...prev };
        for (const { entidadId, claseId, googleEventId } of actualizaciones) {
          next[entidadId] = (next[entidadId] || []).map(c =>
            c.id === claseId ? { ...c, googleEventId } : c
          );
        }
        return next;
      });
    }

    return actualizaciones.length;
  }

  // ARQ-15: envuelve un mutador para contabilizarlo como operación en vuelo.
  function conGuard(fn) {
    return async (...args) => {
      mutacionesEnCurso.current++;
      try { return await fn(...args); }
      finally { mutacionesEnCurso.current--; }
    };
  }

  return (
    <AlumnosContext.Provider value={{
      alumnos, talleres, clases, pagosHistoricos,
      agregarAlumno: conGuard(agregarAlumno),
      editarAlumno: conGuard(editarAlumno),
      eliminarAlumno: conGuard(eliminarAlumno),
      agregarTaller: conGuard(agregarTaller),
      editarTaller: conGuard(editarTaller),
      eliminarTaller: conGuard(eliminarTaller),
      agregarClase: conGuard(agregarClase),
      editarClase: conGuard(editarClase),
      eliminarClase: conGuard(eliminarClase),
      cambiarEstadoClase: conGuard(cambiarEstadoClase),
      togglePagadaClase: conGuard(togglePagadaClase),
      sincronizarClasesExistentes: conGuard(sincronizarClasesExistentes),
    }}>
      {children}
    </AlumnosContext.Provider>
  );
}

export function useAlumnos() {
  const ctx = useContext(AlumnosContext);
  if (!ctx) throw new Error('useAlumnos debe usarse dentro de AlumnosProvider');
  return ctx;
}
