import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { programarNotificacion, cancelarNotificacion } from '../lib/notificaciones';

const AlumnosContext = createContext(null);

export function AlumnosProvider({ children }) {
  const [alumnos, setAlumnos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [clases, setClases] = useState({});
  const [pagosHistoricos, setPagosHistoricos] = useState([]);
  const userIdRef = useRef(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        userIdRef.current = session.user.id;
        cargarDatos();
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setAlumnos([]);
        setTalleres([]);
        setClases({});
        setPagosHistoricos([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function cargarDatos() {
    const [{ data: aData }, { data: tData }, { data: cData }] = await Promise.all([
      supabase.from('alumnos').select('*').order('created_at'),
      supabase.from('talleres').select('*').order('created_at'),
      supabase.from('clases').select('*').order('created_at', { ascending: false }),
    ]);

    const todasIds = new Set([
      ...(aData || []).map(a => a.id),
      ...(tData || []).map(t => t.id),
    ]);

    setAlumnos((aData || []).map(dbToAlumno));
    setTalleres((tData || []).map(dbToTaller));

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

  function dbToTaller(row) {
    return {
      id: row.id,
      nombre: row.nombre,
      instrumento: row.instrumento,
      avatar: row.avatar,
      valorPorAlumno: row.valor_por_alumno,
      diaSemana: row.dia_semana,
      hora: row.hora,
      tipo: row.tipo,
      participantes: row.participantes || [],
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
      participantes: taller.participantes || [],
    };
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
    };
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
      return;
    }
    setAlumnos(prev => prev.map(a => a.id === tempId ? dbToAlumno(data) : a));
    return data.id;
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

    setAlumnos(prev => prev.filter(a => a.id !== id));
    setClases(prev => { const n = { ...prev }; delete n[id]; return n; });

    if (clasesPagadas.length > 0) {
      setPagosHistoricos(prev => [
        ...prev,
        { nombre: entidad?.nombre || 'Alumno eliminado', valorUnitario: entidad?.valorClase || 0, clases: clasesPagadas },
      ]);
    }

    await supabase.from('clases').delete().eq('entidad_id', id).or('pagada.eq.false,pagada.is.null');
    const { error } = await supabase.from('alumnos').delete().eq('id', id);
    if (error) cargarDatos();
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
      console.error('Error al guardar taller:', error?.message, error?.details, error?.hint);
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
    const valorUnitario = (entidad?.valorPorAlumno || 0) * (entidad?.participantes?.length || 1);

    setTalleres(prev => prev.filter(t => t.id !== id));
    setClases(prev => { const n = { ...prev }; delete n[id]; return n; });

    if (clasesPagadas.length > 0) {
      setPagosHistoricos(prev => [
        ...prev,
        { nombre: entidad?.nombre || 'Taller eliminado', valorUnitario, clases: clasesPagadas },
      ]);
    }

    await supabase.from('clases').delete().eq('entidad_id', id).or('pagada.eq.false,pagada.is.null');
    const { error } = await supabase.from('talleres').delete().eq('id', id);
    if (error) cargarDatos();
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
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === tempId ? dbToClase(data) : c),
    }));
    if (clase.estado !== 'cancelada') {
      programarNotificacion(data.id, entidad?.nombre || '', clase.fecha, clase.hora);
    }
  }

  async function editarClase(entidadId, claseActualizada) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseActualizada.id ? claseActualizada : c),
    }));
    const { error } = await supabase
      .from('clases')
      .update({
        fecha: claseActualizada.fecha,
        hora: claseActualizada.hora,
        planificacion: claseActualizada.planificacion,
        tareas: claseActualizada.tareas,
        estado: claseActualizada.estado,
        valor_custom: claseActualizada.valorCustom ?? null,
      })
      .eq('id', claseActualizada.id);
    if (error) cargarDatos();
    if (claseActualizada.estado === 'cancelada') {
      cancelarNotificacion(claseActualizada.id);
    } else {
      const entidad = alumnos.find(a => a.id === entidadId) || talleres.find(t => t.id === entidadId);
      programarNotificacion(claseActualizada.id, entidad?.nombre || '', claseActualizada.fecha, claseActualizada.hora);
    }
  }

  async function eliminarClase(entidadId, claseId) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).filter(c => c.id !== claseId),
    }));
    cancelarNotificacion(claseId);
    const { error } = await supabase.from('clases').delete().eq('id', claseId);
    if (error) cargarDatos();
  }

  async function cambiarEstadoClase(entidadId, claseId, estado) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseId ? { ...c, estado } : c),
    }));
    const { error } = await supabase.from('clases').update({ estado }).eq('id', claseId);
    if (error) cargarDatos();
    if (estado === 'cancelada') {
      cancelarNotificacion(claseId);
    }
  }

  async function togglePagadaClase(entidadId, claseId, pagada) {
    setClases(prev => ({
      ...prev,
      [entidadId]: (prev[entidadId] || []).map(c => c.id === claseId ? { ...c, pagada } : c),
    }));
    const { error } = await supabase.from('clases').update({ pagada }).eq('id', claseId);
    if (error) cargarDatos();
  }

  return (
    <AlumnosContext.Provider value={{
      alumnos, talleres, clases, pagosHistoricos,
      agregarAlumno, editarAlumno, eliminarAlumno,
      agregarTaller, editarTaller, eliminarTaller,
      agregarClase, editarClase, eliminarClase, cambiarEstadoClase, togglePagadaClase,
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
