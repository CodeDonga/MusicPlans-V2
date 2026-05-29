import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useAlumnos } from '../context/AlumnosContext';
import { useTema } from '../context/TemaContext';

const INSTRUMENTOS = [
  { nombre: 'Guitarra', emoji: '🎸' },
  { nombre: 'Piano', emoji: '🎹' },
  { nombre: 'Bajo', emoji: '🎸' },
  { nombre: 'Batería', emoji: '🥁' },
  { nombre: 'Canto', emoji: '🎤' },
  { nombre: 'Saxofón', emoji: '🎷' },
  { nombre: 'Trompeta', emoji: '🎺' },
  { nombre: 'Violín', emoji: '🎻' },
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function NuevoTaller() {
  const router = useRouter();
  const { alumnos, agregarTaller } = useAlumnos();
  const { tema, paleta } = useTema();

  const [nombre, setNombre] = useState('');
  const [instrumento, setInstrumento] = useState(null);
  const [valorPorAlumno, setValorPorAlumno] = useState('');
  const [diaSemana, setDiaSemana] = useState('Lunes');
  const [hora, setHora] = useState(new Date());
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);
  const [mostrarDias, setMostrarDias] = useState(false);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  if (!fontsLoaded) return null;

  const s = makeStyles(paleta);
  const horaFormateada = `${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`;

  function toggleParticipante(alumno) {
    const yaEsta = participantesSeleccionados.find(p => p.id === alumno.id);
    if (yaEsta) {
      setParticipantesSeleccionados(participantesSeleccionados.filter(p => p.id !== alumno.id));
    } else {
      setParticipantesSeleccionados([...participantesSeleccionados, alumno]);
    }
  }

  function handleGuardar() {
    if (!nombre || !instrumento) return;
    agregarTaller({
      nombre,
      instrumento: instrumento.nombre,
      avatar: instrumento.emoji,
      valorPorAlumno: parseInt(valorPorAlumno) || 0,
      diaSemana,
      hora: horaFormateada,
      participantes: participantesSeleccionados,
    });
    router.back();
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBtnTexto}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Nuevo Taller</Text>
        <View style={s.headerBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <Text style={s.label}>Nombre del taller</Text>
          <TextInput style={s.input} placeholder="Ej: Taller de guitarra avanzado" placeholderTextColor={paleta.outline} value={nombre} onChangeText={setNombre} />

          <Text style={s.label}>Instrumento / Disciplina</Text>
          <View style={s.instrumentosGrid}>
            {INSTRUMENTOS.map(inst => {
              const sel = instrumento?.nombre === inst.nombre;
              return (
                <TouchableOpacity key={inst.nombre} style={[s.instrBtn, sel && s.instrBtnActivo]} onPress={() => setInstrumento(inst)} activeOpacity={0.7}>
                  <Text style={s.instrEmoji}>{inst.emoji}</Text>
                  <Text style={[s.instrNombre, sel && s.instrNombreActivo]}>{inst.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.label}>Valor por alumno (CLP)</Text>
          <TextInput style={s.input} placeholder="15000" placeholderTextColor={paleta.outline} value={valorPorAlumno} onChangeText={setValorPorAlumno} keyboardType="numeric" />

          <Text style={s.label}>Día habitual</Text>
          <TouchableOpacity style={s.selector} onPress={() => setMostrarDias(!mostrarDias)}>
            <Text style={s.selectorTexto}>📅  {diaSemana}</Text>
            <Text style={s.selectorFlecha}>{mostrarDias ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {mostrarDias && (
            <View style={s.diasLista}>
              {DIAS.map(dia => (
                <TouchableOpacity key={dia} style={[s.diaItem, diaSemana === dia && s.diaItemActivo]} onPress={() => { setDiaSemana(dia); setMostrarDias(false); }}>
                  <Text style={[s.diaTexto, diaSemana === dia && s.diaTextoActivo]}>{dia}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={s.label}>Hora habitual</Text>
          <TouchableOpacity style={s.selector} onPress={() => setMostrarPickerHora(!mostrarPickerHora)}>
            <Text style={s.selectorTexto}>🕐  {horaFormateada}hs</Text>
            <Text style={s.selectorFlecha}>{mostrarPickerHora ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {mostrarPickerHora && (
            <View style={s.pickerBox}>
              <DateTimePicker value={hora} mode="time" display="spinner" minuteInterval={5} onChange={(_, d) => { if (d) setHora(d); }} style={s.picker} textColor={paleta.onSurface} />
              <TouchableOpacity style={s.btnConfirmar} onPress={() => setMostrarPickerHora(false)}>
                <Text style={s.btnConfirmarTexto}>✅  Confirmar hora</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={s.label}>Participantes</Text>
          {alumnos.length === 0 ? (
            <View style={s.sinAlumnos}>
              <Text style={s.sinAlumnosTexto}>No tienes alumnos registrados aún.</Text>
            </View>
          ) : (
            <View style={s.participantesLista}>
              {alumnos.map(alumno => {
                const sel = !!participantesSeleccionados.find(p => p.id === alumno.id);
                return (
                  <TouchableOpacity key={alumno.id} style={[s.participanteItem, sel && s.participanteItemActivo]} onPress={() => toggleParticipante(alumno)} activeOpacity={0.7}>
                    <Text style={s.participanteEmoji}>{alumno.avatar}</Text>
                    <Text style={[s.participanteNombre, sel && s.participanteNombreActivo]}>{alumno.nombre}</Text>
                    {sel && <Text style={s.participanteCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={s.btnGuardar} onPress={handleGuardar} activeOpacity={0.85}>
            <Text style={s.btnGuardarTexto}>Guardar Taller</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnCancelar} onPress={() => router.back()}>
            <Text style={s.btnCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.outlineVariant, backgroundColor: p.headerBg },
    headerBtn: { width: 40, justifyContent: 'center' },
    headerBtnTexto: { color: p.onSurface, fontSize: 22 },
    headerTitulo: { color: p.onSurface, fontSize: 17, fontFamily: 'Inter_700Bold' },

    label: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 },
    input: { backgroundColor: p.bgInput, borderRadius: 12, padding: 14, color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: p.outlineVariant },

    instrumentosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    instrBtn: { width: '22%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bgInput, borderRadius: 14, borderWidth: 1, borderColor: p.outlineVariant },
    instrBtnActivo: { backgroundColor: p.primaryLight, borderColor: p.primary },
    instrEmoji: { fontSize: 24, marginBottom: 4 },
    instrNombre: { color: p.onSurfaceVariant, fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
    instrNombreActivo: { color: p.primary },

    selector: { backgroundColor: p.bgInput, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: p.outlineVariant },
    selectorTexto: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular' },
    selectorFlecha: { color: p.primary, fontSize: 12 },

    diasLista: { backgroundColor: p.bgCard, borderRadius: 12, borderWidth: 1, borderColor: p.outlineVariant, marginTop: 4, overflow: 'hidden' },
    diaItem: { paddingVertical: 12, paddingHorizontal: 16 },
    diaItemActivo: { backgroundColor: p.primaryLight },
    diaTexto: { color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular' },
    diaTextoActivo: { color: p.primary, fontFamily: 'Inter_700Bold' },

    pickerBox: { backgroundColor: p.bgInput, borderRadius: 12, padding: 8, marginTop: 4, borderWidth: 1, borderColor: p.outlineVariant },
    picker: { height: 160, width: '100%' },
    btnConfirmar: { backgroundColor: p.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
    btnConfirmarTexto: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 },

    sinAlumnos: { backgroundColor: p.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: p.outlineVariant, alignItems: 'center' },
    sinAlumnosTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' },

    participantesLista: { backgroundColor: p.bgCard, borderRadius: 12, borderWidth: 1, borderColor: p.outlineVariant, overflow: 'hidden' },
    participanteItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: p.outlineVariant },
    participanteItemActivo: { backgroundColor: p.primaryLight },
    participanteEmoji: { fontSize: 22 },
    participanteNombre: { flex: 1, color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular' },
    participanteNombreActivo: { color: p.primary, fontFamily: 'Inter_600SemiBold' },
    participanteCheck: { color: p.primary, fontSize: 16, fontFamily: 'Inter_700Bold' },

    btnGuardar: { backgroundColor: p.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 28, shadowColor: p.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
    btnGuardarTexto: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
    btnCancelar: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
    btnCancelarTexto: { color: p.onSurfaceVariant, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  });
}
