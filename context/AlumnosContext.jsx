import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { parseFecha } from '../lib/fechas';
import { programarNotificacion, cancelarNotificacion } from '../lib/notificaciones';
import { crearEvento, editarEvento, eliminarEvento } from '../lib/googleCalendar';

const AlumnosContext = createContext(null);

export function AlumnosProvider({ children }) {
  const { session } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [clases, setClases] = useState({});
  const [pagosHistoricos, setPagosHistoricos] = useState([]);
  const userIdRef = useRef(null);

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
      if (nextState === 'active' && userIdRef.current) cargarDatos();
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
    const { data: { session } } = await supabase.auth.getSession();
    return session?.provider_token ?? null;
  }

  async function safeGCal(fn) {
    try { return await fn(); }
    catch (e) {
      if (e.message === 'TOKEN_EXPIRADO') {
        Alert.alert('Google Calendar desconectado', 'El acceso a Calendar expiró. Ve a Ajustes y vuelve a conectar Google Calendar.');
      }
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

  async function recrearEventoGCal(token, entidadId, clase, entidadNombre) {
    const googleEventId = await safeGCal(() => crearEvento(token, clase, entidadNombre));
    if (!googleEventId) return;
    await supabase.from('clases').update({ google_event_id: googleEventId }).eq('id', clase.id);
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === clase.id ? { ...c, googleEventId } : c),
    }));
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
    const clasesBorradas = (clases[id] || []).filter(c => !c.pagada);

    await supabase.from('clases').delete().eq('entidad_id', id).eq('pagada', false);
    await supabase.from('clases').delete().eq('entidad_id', id).is('pagada', null);
    const { error } = await supabase.from('alumnos').delete().eq('id', id);
    if (error) { cargarDatos(); return; }

    await limpiarClasesBorradas(clasesBorradas);

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
    const clasesBorradas = (clases[id] || []).filter(c => !c.pagada);
    const valorUnitario = (entidad?.valorPorAlumno || 0) * (entidad?.participantes?.length || 1);

    await supabase.from('clases').delete().eq('entidad_id', id).eq('pagada', false);
    await supabase.from('clases').delete().eq('entidad_id', id).is('pagada', null);
    const { error } = await supabase.from('talleres').delete().eq('id', id);
    if (error) { cargarDatos(); return; }

    await limpiarClasesBorradas(clasesBorradas);

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

    if (clase.estado !== 'cancelada') {
      programarNotificacion(data.id, entidad?.nombre || '', clase.fecha, clase.hora);
      const token = await getGoogleToken();
      if (token) {
        try {
          const googleEventId = await crearEvento(token, claseDB, entidad?.nombre || '');
          if (googleEventId) {
            await supabase.from('clases').update({ google_event_id: googleEventId }).eq('id', data.id);
            setClases(prev => ({
              ...prev,
              [entidadId]: (prev[entidadId] || []).map(c => c.id === tempId ? { ...claseDB, googleEventId } : c),
            }));
            return;
          }
        } catch (e) {
          if (e.message === 'TOKEN_EXPIRADO') {
            Alert.alert('Google Calendar desconectado', 'El acceso a Calendar expiró. Ve a Ajustes y vuelve a conectar Google Calendar.');
          }
        }
      }
    }

    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === tempId ? claseDB : c),
    }));
  }

  async function editarClase(entidadId, claseActualizada) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseActualizada.id ? claseActualizada : c),
    }));

    const cancelando = claseActualizada.estado === 'cancelada';
    const dbUpdate = {
      fecha: claseActualizada.fecha,
      hora: claseActualizada.hora,
      planificacion: claseActualizada.planificacion,
      tareas: claseActualizada.tareas,
      estado: claseActualizada.estado,
      valor_custom: claseActualizada.valorCustom ?? null,
    };
    if (cancelando && claseActualizada.googleEventId) dbUpdate.google_event_id = null;

    const { error } = await supabase.from('clases').update(dbUpdate).eq('id', claseActualizada.id);
    if (error) { cargarDatos(); return; }

    const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);

    if (cancelando) {
      cancelarNotificacion(claseActualizada.id);
      if (claseActualizada.googleEventId) {
        const token = await getGoogleToken();
        if (token) await safeGCal(() => eliminarEvento(token, claseActualizada.googleEventId));
        setClases(prev => ({
          ...prev,
          [entidadId]: (prev[entidadId] || []).map(c =>
            c.id === claseActualizada.id ? { ...c, googleEventId: null } : c
          ),
        }));
      }
    } else {
      programarNotificacion(claseActualizada.id, entidad?.nombre || '', claseActualizada.fecha, claseActualizada.hora);
      const token = await getGoogleToken();
      if (token) {
        if (claseActualizada.googleEventId) {
          await safeGCal(() => editarEvento(token, claseActualizada.googleEventId, claseActualizada, entidad?.nombre || ''));
        } else {
          await recrearEventoGCal(token, entidadId, claseActualizada, entidad?.nombre || '');
        }
      }
    }
  }

  async function eliminarClase(entidadId, claseId) {
    const clase = (clases[entidadId] || []).find(c => c.id === claseId);
    const { error } = await supabase.from('clases').delete().eq('id', claseId);
    if (error) return;
    cancelarNotificacion(claseId);
    if (clase?.googleEventId) {
      const token = await getGoogleToken();
      if (token) await safeGCal(() => eliminarEvento(token, clase.googleEventId));
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
    const dbUpdate = { estado };
    if (estado === 'cancelada' && clase?.googleEventId) dbUpdate.google_event_id = null;
    const { error } = await supabase.from('clases').update(dbUpdate).eq('id', claseId);
    if (error) cargarDatos();
    if (estado === 'cancelada') {
      cancelarNotificacion(claseId);
      if (clase?.googleEventId) {
        const token = await getGoogleToken();
        if (token) await safeGCal(() => eliminarEvento(token, clase.googleEventId));
        setClases(prev => ({
          ...prev,
          [entidadId]: (prev[entidadId] || []).map(c => c.id === claseId ? { ...c, googleEventId: null } : c),
        }));
      }
    } else if (estadoPrevio === 'cancelada' && clase) {
      const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
      programarNotificacion(claseId, entidad?.nombre || '', clase.fecha, clase.hora);
      if (!clase.googleEventId) {
        const token = await getGoogleToken();
        if (token) await recrearEventoGCal(token, entidadId, { ...clase, estado }, entidad?.nombre || '');
      }
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

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const actualizaciones = [];

    for (const [entidadId, clasesEntidad] of Object.entries(clases)) {
      const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
      if (!entidad) continue;

      for (const clase of clasesEntidad) {
        if (clase.googleEventId) continue;
        if (clase.estado === 'cancelada') continue;
        const fechaClase = parseFecha(clase.fecha);
        if (!fechaClase || fechaClase < hoy) continue;

        try {
          const googleEventId = await crearEvento(token, clase, entidad.nombre);
          if (googleEventId) {
            await supabase.from('clases').update({ google_event_id: googleEventId }).eq('id', clase.id);
            actualizaciones.push({ entidadId, claseId: clase.id, googleEventId });
          }
        } catch (e) {
          if (e.message === 'TOKEN_EXPIRADO') return actualizaciones.length;
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

  return (
    <AlumnosContext.Provider value={{
      alumnos, talleres, clases, pagosHistoricos,
      agregarAlumno, editarAlumno, eliminarAlumno,
      agregarTaller, editarTaller, eliminarTaller,
      agregarClase, editarClase, eliminarClase, cambiarEstadoClase, togglePagadaClase,
      sincronizarClasesExistentes,
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
