import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useAlumnos } from '../../context/AlumnosContext';
import { useTema } from '../../context/TemaContext';
import { parseFecha } from '../../lib/fechas';

const ESTADOS = ['pendiente', 'realizada', 'cancelada', 'reagendada'];
const ESTADO_LABEL = { pendiente: 'Pendiente', realizada: 'Realizada', cancelada: 'Cancelada', reagendada: 'Reagendada' };

const DIA_A_JS = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };

function proximaFechaHabitual(diaSemana, horaStr) {
  const targetDay = DIA_A_JS[diaSemana];
  if (targetDay === undefined) return new Date();
  const [hh, mm] = (horaStr || '00:00').split(':').map(n => parseInt(n) || 0);
  const ahora = new Date();
  const diasHasta = (targetDay - ahora.getDay() + 7) % 7;
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasHasta);
  fecha.setHours(hh, mm, 0, 0);
  if (fecha <= ahora) fecha.setDate(fecha.getDate() + 7);
  return fecha;
}

const INSTRUMENTOS = [
  { nombre: 'Guitarra', emoji: '🎸' }, { nombre: 'Piano', emoji: '🎹' },
  { nombre: 'Bajo', emoji: '🎸' }, { nombre: 'Batería', emoji: '🥁' },
  { nombre: 'Canto', emoji: '🎤' }, { nombre: 'Saxofón', emoji: '🎷' },
  { nombre: 'Trompeta', emoji: '🎺' }, { nombre: 'Violín', emoji: '🎻' },
];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Perfil() {
  const { id, tipo } = useLocalSearchParams();
  return <PerfilContent key={`${tipo}-${id}`} id={id} tipo={tipo} />;
}

function PerfilContent({ id, tipo }) {
  const router = useRouter();
  const { alumnos, talleres, clases, editarAlumno, eliminarAlumno, editarTaller, eliminarTaller, agregarClase, editarClase, eliminarClase, cambiarEstadoClase, togglePagadaClase } = useAlumnos();
  const { tema, paleta } = useTema();

  const esTaller = tipo === 'taller';
  const entidad = esTaller
    ? talleres.find(t => t.id === id)
    : alumnos.find(a => a.id === id);
  const clasesEntidad = [...(clases[id] || [])].sort((a, b) => {
    const ta = parseFecha(a.fecha)?.getTime() ?? 0;
    const tb = parseFecha(b.fecha)?.getTime() ?? 0;
    return tb - ta;
  });

  const [mostrarFormClase, setMostrarFormClase] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(new Date());
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [nuevaHora, setNuevaHora] = useState(new Date());
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);
  const [nuevaPlanificacion, setNuevaPlanificacion] = useState('');
  const [nuevasTareas, setNuevasTareas] = useState('');
  const [nuevoValorCustom, setNuevoValorCustom] = useState('');

  const [modalEditarAlumno, setModalEditarAlumno] = useState(false);
  const [editNombre, setEditNombre] = useState(entidad?.nombre || '');
  const [editInstrumento, setEditInstrumento] = useState(
    esTaller ? null : (INSTRUMENTOS.find(i => i.nombre === entidad?.instrumento) || INSTRUMENTOS[0])
  );
  const [editInstrumentos, setEditInstrumentos] = useState(
    esTaller
      ? (entidad?.instrumento || '').split(', ').map(n => INSTRUMENTOS.find(i => i.nombre === n.trim())).filter(Boolean)
      : []
  );
  const [editParticipantes, setEditParticipantes] = useState(entidad?.participantes || []);
  const [editDia, setEditDia] = useState(entidad?.diaSemana || 'Lunes');
  const [editHora, setEditHora] = useState(() => {
    if (entidad?.hora) {
      const [hh, mm] = entidad.hora.split(':').map(Number);
      const d = new Date();
      d.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0);
      return d;
    }
    return new Date();
  });
  const [mostrarEditPickerHora, setMostrarEditPickerHora] = useState(false);
  const [mostrarEditDias, setMostrarEditDias] = useState(false);

  const [claseEditando, setClaseEditando] = useState(null);
  const [editPlanificacion, setEditPlanificacion] = useState('');
  const [editTareas, setEditTareas] = useState('');
  const [editValorCustom, setEditValorCustom] = useState('');
  const [editFechaClase, setEditFechaClase] = useState(new Date());
  const [mostrarPickerEditFecha, setMostrarPickerEditFecha] = useState(false);
  const [editHoraClase, setEditHoraClase] = useState(new Date());
  const [mostrarPickerEditHoraClase, setMostrarPickerEditHoraClase] = useState(false);
  const [editEstado, setEditEstado] = useState('pendiente');

  const [dropdownEstadoId, setDropdownEstadoId] = useState(null);
  const [editValor, setEditValor] = useState(
    String(esTaller ? (entidad?.valorPorAlumno || '') : (entidad?.valorClase || ''))
  );

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const s = useMemo(() => makeStyles(paleta), [paleta]);

  if (!fontsLoaded) return null;
  if (!entidad) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: paleta.bg }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
            <Text style={s.headerBtnTexto}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitulo}>Perfil</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: paleta.onSurfaceVariant, fontSize: 15, fontFamily: 'Inter_400Regular' }}>
            No se encontró el perfil.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fechaFormateada = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const horaFormateada = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  function handleAgregarClase() {
    if (nuevoValorCustom) {
      const v = parseInt(nuevoValorCustom);
      if (isNaN(v) || v <= 0) {
        Alert.alert('Valor inválido', 'El valor personalizado debe ser un número mayor a 0.');
        return;
      }
    }
    agregarClase(id, {
      fecha: fechaFormateada(nuevaFecha),
      hora: horaFormateada(nuevaHora),
      planificacion: nuevaPlanificacion,
      tareas: nuevasTareas,
      estado: 'pendiente',
      valorCustom: nuevoValorCustom ? parseInt(nuevoValorCustom) : null,
    });
    setNuevaPlanificacion(''); setNuevasTareas(''); setNuevoValorCustom('');
    setNuevaFecha(new Date()); setNuevaHora(new Date());
    setMostrarFormClase(false);
  }

  function handleEliminar() {
    Alert.alert(
      esTaller ? '¿Eliminar taller?' : '¿Eliminar alumno?',
      'Una vez realizado no podrás volver atrás.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          esTaller ? eliminarTaller(id) : eliminarAlumno(id);
          router.back();
        }},
      ]
    );
  }

  function toggleEditInstrumento(inst) {
    const yaEsta = editInstrumentos.find(i => i.nombre === inst.nombre);
    if (yaEsta) {
      setEditInstrumentos(editInstrumentos.filter(i => i.nombre !== inst.nombre));
    } else {
      setEditInstrumentos([...editInstrumentos, inst]);
    }
  }

  function toggleEditParticipante(alumno) {
    const yaEsta = editParticipantes.find(p => p.id === alumno.id);
    if (yaEsta) {
      setEditParticipantes(editParticipantes.filter(p => p.id !== alumno.id));
    } else {
      setEditParticipantes([...editParticipantes, alumno]);
    }
  }

  function handleGuardarEdicion() {
    if (!editNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }
    const horaStr = horaFormateada(editHora);
    const valorInt = parseInt(editValor) || 0;
    if (esTaller) {
      editarTaller({
        ...entidad,
        nombre: editNombre.trim(),
        instrumento: editInstrumentos.map(i => i.nombre).join(', '),
        avatar: editInstrumentos.map(i => i.emoji).slice(0, 2).join('') || entidad.avatar,
        diaSemana: editDia,
        hora: horaStr,
        participantes: editParticipantes,
        valorPorAlumno: valorInt,
      });
    } else {
      editarAlumno({
        ...entidad,
        nombre: editNombre.trim(),
        instrumento: editInstrumento.nombre,
        avatar: editInstrumento.emoji,
        diaSemana: editDia,
        hora: horaStr,
        valorClase: valorInt,
      });
    }
    setModalEditarAlumno(false);
  }

  function abrirEditarClase(clase, usarHabitual = false) {
    setClaseEditando(clase);
    setEditPlanificacion(clase.planificacion);
    setEditTareas(clase.tareas);
    setEditEstado(clase.estado || 'pendiente');
    setEditValorCustom(clase.valorCustom ? String(clase.valorCustom) : '');
    setMostrarPickerEditFecha(false);
    setMostrarPickerEditHoraClase(false);
    if (usarHabitual) {
      const defaults = proximaFechaHabitual(entidad.diaSemana, entidad.hora);
      setEditFechaClase(defaults);
      setEditHoraClase(defaults);
    } else {
      const fechaParsed = parseFecha(clase.fecha);
      if (fechaParsed) setEditFechaClase(fechaParsed);
      const [hh, mm] = (clase.hora || '00:00').split(':').map(Number);
      const horaDate = new Date();
      horaDate.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0);
      setEditHoraClase(horaDate);
    }
  }

  function handleGuardarClase() {
    if (editValorCustom) {
      const v = parseInt(editValorCustom);
      if (isNaN(v) || v <= 0) {
        Alert.alert('Valor inválido', 'El valor personalizado debe ser un número mayor a 0.');
        return;
      }
    }
    editarClase(id, {
      ...claseEditando,
      planificacion: editPlanificacion,
      tareas: editTareas,
      estado: editEstado,
      fecha: fechaFormateada(editFechaClase),
      hora: horaFormateada(editHoraClase),
      valorCustom: editValorCustom ? parseInt(editValorCustom) : null,
    });
    setClaseEditando(null);
  }

  function handleEliminarClase(claseId) {
    Alert.alert('¿Eliminar clase?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarClase(id, claseId) },
    ]);
  }

  function getBadgeStyle(estado) {
    const colores = {
      pendiente:  { bg: paleta.primaryLight, text: paleta.primary },
      realizada:  { bg: paleta.successFaint, text: paleta.success },
      cancelada:  { bg: paleta.alertFaint,   text: paleta.alert },
      reagendada: { bg: paleta.warning + '22', text: paleta.warning },
    };
    return colores[estado] || colores.pendiente;
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBtnTexto}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>{esTaller ? 'Taller' : 'Alumno'}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Perfil */}
        <View style={s.perfilSection}>
          <View style={s.avatarGrandeWrap}>
            <Text style={s.avatarGrande}>{entidad.avatar || '🎵'}</Text>
          </View>
          <Text style={s.nombreAlumno}>{entidad.nombre}</Text>
          <Text style={s.instrumentoTexto}>{entidad.instrumento}</Text>
          <Text style={s.horarioTexto}>{entidad.diaSemana} · {entidad.hora}hs</Text>
          {esTaller && entidad.participantes?.length > 0 && (
            <View style={s.participantesRow}>
              {entidad.participantes.map(p => (
                <View key={p.id} style={s.participanteBadge}>
                  <Text style={s.participanteBadgeTexto}>{p.nombre}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={s.accionesRow}>
            <TouchableOpacity style={s.btnEditar} onPress={() => setModalEditarAlumno(true)}>
              <Text style={s.btnEditarTexto}>✏️  Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnEliminar} onPress={handleEliminar}>
              <Text style={s.btnEliminarTexto}>🗑️  Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Registro de clases */}
        <View style={s.seccionHeader}>
          <Text style={s.seccionTitulo}>Registro de Clases</Text>
        </View>

        <View style={s.px}>
          {!mostrarFormClase ? (
            <TouchableOpacity style={s.btnAgregarClase} onPress={() => {
              const defaults = proximaFechaHabitual(entidad.diaSemana, entidad.hora);
              setNuevaFecha(defaults);
              setNuevaHora(defaults);
              setMostrarFormClase(true);
            }}>
              <Text style={s.btnAgregarClaseTexto}>＋  Agregar clase</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.formulario}>
              <Text style={s.formLabel}>📅 Fecha</Text>
              <TouchableOpacity style={s.selector} onPress={() => setMostrarPickerFecha(true)}>
                <Text style={s.selectorTexto}>{fechaFormateada(nuevaFecha)}</Text>
                <Text style={s.selectorFlecha}>›</Text>
              </TouchableOpacity>
              {mostrarPickerFecha && (
                <DateTimePicker
                  value={nuevaFecha}
                  mode="date"
                  display="default"
                  onChange={(event, d) => {
                    setMostrarPickerFecha(false);
                    if (event.type === 'set' && d) setNuevaFecha(d);
                  }}
                />
              )}
              <Text style={s.formLabel}>🕐 Hora</Text>
              <TouchableOpacity style={s.selector} onPress={() => setMostrarPickerHora(true)}>
                <Text style={s.selectorTexto}>{horaFormateada(nuevaHora)}hs</Text>
                <Text style={s.selectorFlecha}>›</Text>
              </TouchableOpacity>
              {mostrarPickerHora && (
                <DateTimePicker
                  value={nuevaHora}
                  mode="time"
                  display="default"
                  minuteInterval={5}
                  onChange={(event, d) => {
                    setMostrarPickerHora(false);
                    if (event.type === 'set' && d) setNuevaHora(d);
                  }}
                />
              )}
              <Text style={s.formLabel}>📋 Planificación</Text>
              <TextInput style={[s.input, { minHeight: 80 }]} placeholder="¿Qué vas a enseñar?" placeholderTextColor={paleta.outline} value={nuevaPlanificacion} onChangeText={setNuevaPlanificacion} multiline />
              <Text style={s.formLabel}>✅ Tarea</Text>
              <TextInput style={[s.input, { minHeight: 60 }]} placeholder="¿Qué debe practicar?" placeholderTextColor={paleta.outline} value={nuevasTareas} onChangeText={setNuevasTareas} multiline />
              <Text style={s.formLabel}>💵 Valor personalizado (opcional)</Text>
              <TextInput style={s.input} placeholder={`Por defecto: $${(entidad.valorClase || entidad.valorPorAlumno || 0).toLocaleString('es-CL')}`} placeholderTextColor={paleta.outline} value={nuevoValorCustom} onChangeText={setNuevoValorCustom} keyboardType="numeric" />
              <TouchableOpacity style={s.btnGuardar} onPress={handleAgregarClase}><Text style={s.btnGuardarTexto}>💾 Guardar Clase</Text></TouchableOpacity>
              <TouchableOpacity style={s.btnCancelarInline} onPress={() => setMostrarFormClase(false)}><Text style={s.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
            </View>
          )}

          {clasesEntidad.length === 0 && !mostrarFormClase && (
            <Text style={s.sinClases}>Aún no hay clases registradas</Text>
          )}

          {clasesEntidad.map((clase, index) => {
            const badgeColors = getBadgeStyle(clase.estado || 'pendiente');
            return (
              <View key={clase.id} style={s.claseCard}>
                <View style={s.claseCardHeader}>
                  <View>
                    <Text style={s.claseFecha}>{clase.fecha} · {clase.hora}hs</Text>
                    <Text style={s.claseNumero}>Clase #{clasesEntidad.length - index}</Text>
                  </View>
                  <View>
                    <TouchableOpacity
                      style={[s.badge, { backgroundColor: badgeColors.bg }]}
                      onPress={() => setDropdownEstadoId(dropdownEstadoId === clase.id ? null : clase.id)}
                    >
                      <Text style={[s.badgeTexto, { color: badgeColors.text }]}>{ESTADO_LABEL[clase.estado || 'pendiente']}</Text>
                      <Text style={[s.badgeFlecha, { color: badgeColors.text }]}>▾</Text>
                    </TouchableOpacity>
                    {dropdownEstadoId === clase.id && (
                      <View style={s.estadoDropdown}>
                        {ESTADOS.map(e => (
                          <TouchableOpacity key={e} style={s.estadoOpcion} onPress={() => {
                            cambiarEstadoClase(id, clase.id, e);
                            setDropdownEstadoId(null);
                            if (e === 'reagendada') setTimeout(() => abrirEditarClase({ ...clase, estado: 'reagendada' }, true), 150);
                          }}>
                            <Text style={[s.estadoOpcionTexto, (clase.estado || 'pendiente') === e && { color: paleta.primary, fontFamily: 'Inter_700Bold' }, e === 'reagendada' && { color: paleta.warning }]}>{ESTADO_LABEL[e]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                {!!clase.valorCustom && (
                  <View style={s.claseRow}>
                    <Text style={s.claseRowIcon}>💵</Text>
                    <View style={s.claseRowContent}>
                      <Text style={s.claseRowLabel}>Valor de esta clase</Text>
                      <Text style={[s.claseRowTexto, { color: paleta.primary, fontFamily: 'Inter_700Bold' }]}>${clase.valorCustom.toLocaleString('es-CL')}</Text>
                    </View>
                  </View>
                )}
                {!!clase.planificacion && (
                  <View style={s.claseRow}>
                    <Text style={s.claseRowIcon}>📋</Text>
                    <View style={s.claseRowContent}>
                      <Text style={s.claseRowLabel}>Planificación</Text>
                      <Text style={s.claseRowTexto}>{clase.planificacion}</Text>
                    </View>
                  </View>
                )}
                {!!clase.tareas && (
                  <View style={s.claseRow}>
                    <Text style={s.claseRowIcon}>✅</Text>
                    <View style={s.claseRowContent}>
                      <Text style={s.claseRowLabel}>Tarea</Text>
                      <Text style={s.claseRowTexto}>{clase.tareas}</Text>
                    </View>
                  </View>
                )}
                <View style={s.claseAcciones}>
                  <TouchableOpacity style={s.btnEditarClase} onPress={() => abrirEditarClase(clase)}>
                    <Text style={s.btnEditarClaseTexto}>✏️  Editar clase</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnEliminarClase} onPress={() => handleEliminarClase(clase.id)}>
                    <Text style={s.btnEliminarClaseTexto}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                {clase.estado !== 'cancelada' && (
                  <TouchableOpacity
                    style={[s.btnPago, clase.pagada && s.btnPagoPagado]}
                    onPress={() => togglePagadaClase(id, clase.id, !clase.pagada)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.btnPagoTexto, clase.pagada && s.btnPagoTextoPagado]}>
                      {clase.pagada ? '💰  Pagada' : '💸  Marcar como pagada'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal editar alumno/taller */}
      <Modal visible={modalEditarAlumno} animationType="slide" transparent onRequestClose={() => setModalEditarAlumno(false)}>
        <View style={s.modalFondo}>
          <ScrollView contentContainerStyle={s.modalContenido} keyboardShouldPersistTaps="handled">
            <Text style={s.modalTitulo}>✏️ Editar {esTaller ? 'Taller' : 'Alumno'}</Text>
            <Text style={s.formLabel}>Nombre</Text>
            <TextInput style={s.input} value={editNombre} onChangeText={setEditNombre} placeholderTextColor={paleta.outline} />
            <Text style={s.formLabel}>Instrumento</Text>
            <View style={s.instrumentosGrid}>
              {INSTRUMENTOS.map(inst => {
                const sel = esTaller
                  ? !!editInstrumentos.find(i => i.nombre === inst.nombre)
                  : editInstrumento?.nombre === inst.nombre;
                return (
                  <TouchableOpacity key={inst.nombre} style={[s.instrBtn, sel && s.instrBtnActivo]}
                    onPress={() => esTaller ? toggleEditInstrumento(inst) : setEditInstrumento(inst)}
                    activeOpacity={0.7}>
                    <Text style={s.instrEmoji}>{inst.emoji}</Text>
                    <Text style={[s.instrNombre, sel && s.instrNombreActivo]}>{inst.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {esTaller && (
              <>
                <Text style={s.formLabel}>Participantes</Text>
                {alumnos.length === 0 ? (
                  <View style={s.sinAlumnos}>
                    <Text style={s.sinAlumnosTexto}>No tienes alumnos registrados.</Text>
                  </View>
                ) : (
                  <View style={s.participantesLista}>
                    {alumnos.map(alumno => {
                      const sel = !!editParticipantes.find(p => p.id === alumno.id);
                      return (
                        <TouchableOpacity key={alumno.id} style={[s.participanteItem, sel && s.participanteItemActivo]} onPress={() => toggleEditParticipante(alumno)} activeOpacity={0.7}>
                          <Text style={s.participanteEmoji}>{alumno.avatar}</Text>
                          <Text style={[s.participanteNombre, sel && s.participanteNombreActivo]}>{alumno.nombre}</Text>
                          {sel && <Text style={s.participanteCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}
            <Text style={s.formLabel}>{esTaller ? 'Valor por alumno (CLP)' : 'Valor de la clase (CLP)'}</Text>
            <TextInput
              style={s.input}
              placeholder="0"
              placeholderTextColor={paleta.outline}
              value={editValor}
              onChangeText={setEditValor}
              keyboardType="numeric"
            />
            <Text style={s.formLabel}>Día habitual</Text>
            <TouchableOpacity style={s.selector} onPress={() => setMostrarEditDias(!mostrarEditDias)}>
              <Text style={s.selectorTexto}>📅  {editDia}</Text>
              <Text style={s.selectorFlecha}>{mostrarEditDias ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {mostrarEditDias && (
              <View style={s.diasLista}>
                {DIAS.map(dia => (
                  <TouchableOpacity key={dia} style={[s.diaItem, editDia === dia && s.diaItemActivo]} onPress={() => { setEditDia(dia); setMostrarEditDias(false); }}>
                    <Text style={[s.diaTexto, editDia === dia && s.diaTextoActivo]}>{dia}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={s.formLabel}>Hora habitual</Text>
            <TouchableOpacity style={s.selector} onPress={() => setMostrarEditPickerHora(true)}>
              <Text style={s.selectorTexto}>🕐  {horaFormateada(editHora)}hs</Text>
              <Text style={s.selectorFlecha}>›</Text>
            </TouchableOpacity>
            {mostrarEditPickerHora && (
              <DateTimePicker
                value={editHora}
                mode="time"
                display="default"
                minuteInterval={5}
                onChange={(event, d) => {
                  setMostrarEditPickerHora(false);
                  if (event.type === 'set' && d) setEditHora(d);
                }}
              />
            )}
            <TouchableOpacity style={[s.btnGuardar, { marginTop: 20 }]} onPress={handleGuardarEdicion}><Text style={s.btnGuardarTexto}>💾 Guardar Cambios</Text></TouchableOpacity>
            <TouchableOpacity style={s.btnCancelarInline} onPress={() => setModalEditarAlumno(false)}><Text style={s.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal editar clase */}
      <Modal visible={!!claseEditando} animationType="slide" transparent onRequestClose={() => setClaseEditando(null)}>
        <View style={s.modalFondo}>
          <ScrollView contentContainerStyle={s.modalContenido} keyboardShouldPersistTaps="handled">
            <Text style={s.modalTitulo}>✏️ Editar Clase</Text>
            <Text style={s.formLabel}>📅 Fecha</Text>
            <TouchableOpacity style={s.selector} onPress={() => setMostrarPickerEditFecha(true)}>
              <Text style={s.selectorTexto}>{fechaFormateada(editFechaClase)}</Text>
              <Text style={s.selectorFlecha}>›</Text>
            </TouchableOpacity>
            {mostrarPickerEditFecha && (
              <DateTimePicker
                value={editFechaClase}
                mode="date"
                display="default"
                onChange={(event, d) => {
                  setMostrarPickerEditFecha(false);
                  if (event.type === 'set' && d) setEditFechaClase(d);
                }}
              />
            )}
            <Text style={s.formLabel}>🕐 Hora</Text>
            <TouchableOpacity style={s.selector} onPress={() => setMostrarPickerEditHoraClase(true)}>
              <Text style={s.selectorTexto}>{horaFormateada(editHoraClase)}hs</Text>
              <Text style={s.selectorFlecha}>›</Text>
            </TouchableOpacity>
            {mostrarPickerEditHoraClase && (
              <DateTimePicker
                value={editHoraClase}
                mode="time"
                display="default"
                minuteInterval={5}
                onChange={(event, d) => {
                  setMostrarPickerEditHoraClase(false);
                  if (event.type === 'set' && d) setEditHoraClase(d);
                }}
              />
            )}
            <Text style={s.formLabel}>Estado</Text>
            <View style={s.estadosRow}>
              {ESTADOS.map(e => (
                <TouchableOpacity key={e} style={[s.estadoBtn, e === 'reagendada' && s.estadoBtnReagendada, editEstado === e && (e === 'reagendada' ? s.estadoBtnReagendadaActivo : s.estadoBtnActivo)]} onPress={() => setEditEstado(e)}>
                  <Text style={[s.estadoBtnTexto, editEstado === e && (e === 'reagendada' ? { color: paleta.warning, fontFamily: 'Inter_700Bold' } : s.estadoBtnTextoActivo)]}>{ESTADO_LABEL[e]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.formLabel}>📋 Planificación</Text>
            <TextInput style={[s.input, { minHeight: 80 }]} value={editPlanificacion} onChangeText={setEditPlanificacion} placeholderTextColor={paleta.outline} multiline />
            <Text style={s.formLabel}>✅ Tarea</Text>
            <TextInput style={[s.input, { minHeight: 60 }]} value={editTareas} onChangeText={setEditTareas} placeholderTextColor={paleta.outline} multiline />
            <Text style={s.formLabel}>💵 Valor personalizado (opcional)</Text>
            <TextInput style={s.input} placeholder={`Por defecto: $${(entidad.valorClase || entidad.valorPorAlumno || 0).toLocaleString('es-CL')}`} placeholderTextColor={paleta.outline} value={editValorCustom} onChangeText={setEditValorCustom} keyboardType="numeric" />
            <TouchableOpacity style={[s.btnGuardar, { marginTop: 16 }]} onPress={handleGuardarClase}><Text style={s.btnGuardarTexto}>💾 Guardar</Text></TouchableOpacity>
            <TouchableOpacity style={s.btnCancelarInline} onPress={() => setClaseEditando(null)}><Text style={s.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingBottom: 24 },
    px: { paddingHorizontal: 16 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.outlineVariant, backgroundColor: p.headerBg },
    headerBtn: { width: 40, justifyContent: 'center' },
    headerBtnTexto: { color: p.onSurface, fontSize: 22 },
    headerTitulo: { color: p.onSurface, fontSize: 17, fontFamily: 'Inter_700Bold' },

    perfilSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: p.outlineVariant },
    avatarGrandeWrap: { width: 96, height: 96, borderRadius: 24, backgroundColor: p.primaryMid, borderWidth: 2, borderColor: p.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    avatarGrande: { fontSize: 46 },
    nombreAlumno: { color: p.onSurface, fontSize: 24, fontFamily: 'Inter_800ExtraBold', marginBottom: 4, letterSpacing: -0.5 },
    instrumentoTexto: { color: p.secondary, fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
    horarioTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
    participantesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, justifyContent: 'center' },
    participanteBadge: { backgroundColor: p.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: p.primaryBorder },
    participanteBadgeTexto: { color: p.primary, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    accionesRow: { flexDirection: 'row', gap: 12 },
    btnEditar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.primaryLight, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: p.primaryBorder },
    btnEditarTexto: { color: p.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    btnEliminar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.alertFaint, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 },
    btnEliminarTexto: { color: p.alert, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

    seccionHeader: { paddingHorizontal: 16, paddingVertical: 16 },
    seccionTitulo: { color: p.onSurface, fontSize: 20, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },

    btnAgregarClase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: p.primary, borderRadius: 14, height: 52, marginBottom: 16, shadowColor: p.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    btnAgregarClaseTexto: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

    formulario: { backgroundColor: p.bgCard, borderRadius: 16, borderWidth: 1, borderColor: p.outlineVariant, padding: 16, marginBottom: 16 },
    formLabel: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
    input: { backgroundColor: p.bgInput, borderRadius: 10, padding: 12, color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: p.outlineVariant, marginBottom: 4 },
    selector: { backgroundColor: p.bgInput, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: p.outlineVariant, marginBottom: 4 },
    selectorTexto: { color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular' },
    selectorFlecha: { color: p.primary, fontSize: 16 },
    pickerBox: { backgroundColor: p.bgInput, borderRadius: 12, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: p.outlineVariant },
    picker: { height: 160, width: '100%' },
    btnConfirmar: { backgroundColor: p.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
    btnConfirmarTexto: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 },

    sinClases: { color: p.onSurfaceVariant, textAlign: 'center', marginVertical: 32, fontSize: 14, fontFamily: 'Inter_400Regular' },

    claseCard: { backgroundColor: p.bgCard, borderRadius: 16, borderWidth: 1, borderColor: p.outlineVariant, padding: 16, marginBottom: 14 },
    claseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    claseFecha: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    claseNumero: { color: p.onSurface, fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },

    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
    badgeTexto: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
    badgeFlecha: { fontSize: 10 },
    estadoDropdown: { position: 'absolute', top: 30, right: 0, backgroundColor: p.bgCard, borderRadius: 12, borderWidth: 1, borderColor: p.outlineVariant, zIndex: 100, minWidth: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
    estadoOpcion: { paddingVertical: 10, paddingHorizontal: 14 },
    estadoOpcionTexto: { color: p.onSurface, fontSize: 13, fontFamily: 'Inter_400Regular' },

    claseRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    claseRowIcon: { fontSize: 16, marginTop: 2 },
    claseRowContent: { flex: 1 },
    claseRowLabel: { color: p.onSurface, fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
    claseRowTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    claseAcciones: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.outlineVariant },
    btnEditarClase: { flex: 1, backgroundColor: p.primaryLight, borderRadius: 10, height: 38, alignItems: 'center', justifyContent: 'center' },
    btnEditarClaseTexto: { color: p.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    btnEliminarClase: { backgroundColor: p.alertFaint, borderRadius: 10, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    btnEliminarClaseTexto: { fontSize: 16 },
    btnPago: { marginTop: 10, backgroundColor: p.bgInput, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: p.outlineVariant },
    btnPagoPagado: { backgroundColor: p.successFaint, borderColor: p.success },
    btnPagoTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    btnPagoTextoPagado: { color: p.success },

    btnGuardar: { backgroundColor: p.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8, shadowColor: p.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    btnGuardarTexto: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
    btnCancelarInline: { alignItems: 'center', paddingVertical: 14 },
    btnCancelarTexto: { color: p.onSurfaceVariant, fontFamily: 'Inter_600SemiBold', fontSize: 14 },

    modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
    modalContenido: { backgroundColor: p.bgModal, margin: 16, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: p.outlineVariant },
    modalTitulo: { color: p.onSurface, fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 8 },

    instrumentosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    instrBtn: { width: '22%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bgInput, borderRadius: 14, borderWidth: 1, borderColor: p.outlineVariant },
    instrBtnActivo: { backgroundColor: p.primaryLight, borderColor: p.primary },
    instrEmoji: { fontSize: 22, marginBottom: 2 },
    instrNombre: { color: p.onSurfaceVariant, fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
    instrNombreActivo: { color: p.primary },

    sinAlumnos: { backgroundColor: p.bgInput, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: p.outlineVariant, alignItems: 'center' },
    sinAlumnosTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' },
    participantesLista: { backgroundColor: p.bgCard, borderRadius: 12, borderWidth: 1, borderColor: p.outlineVariant, overflow: 'hidden' },
    participanteItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: p.outlineVariant },
    participanteItemActivo: { backgroundColor: p.primaryLight },
    participanteEmoji: { fontSize: 22 },
    participanteNombre: { flex: 1, color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular' },
    participanteNombreActivo: { color: p.primary, fontFamily: 'Inter_600SemiBold' },
    participanteCheck: { color: p.primary, fontSize: 16, fontFamily: 'Inter_700Bold' },

    diasLista: { backgroundColor: p.bgCard, borderRadius: 12, borderWidth: 1, borderColor: p.outlineVariant, marginTop: 4, overflow: 'hidden' },
    diaItem: { paddingVertical: 12, paddingHorizontal: 16 },
    diaItemActivo: { backgroundColor: p.primaryLight },
    diaTexto: { color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular' },
    diaTextoActivo: { color: p.primary, fontFamily: 'Inter_700Bold' },

    estadosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    estadoBtn: { width: '47%', paddingVertical: 10, borderRadius: 10, backgroundColor: p.bgInput, borderWidth: 1, borderColor: p.outlineVariant, alignItems: 'center' },
    estadoBtnActivo: { backgroundColor: p.primaryLight, borderColor: p.primary },
    estadoBtnTexto: { color: p.onSurfaceVariant, fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    estadoBtnTextoActivo: { color: p.primary },
    estadoBtnReagendada: { borderColor: p.warning + '60' },
    estadoBtnReagendadaActivo: { backgroundColor: p.warning + '20', borderColor: p.warning },
  });
}
