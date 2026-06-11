import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function NuevoAlumno() {
  const router = useRouter();
  const { agregarAlumno } = useAlumnos();
  const { tema, paleta } = useTema();

  const [nombre, setNombre] = useState('');
  const [instrumento, setInstrumento] = useState(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [valorClase, setValorClase] = useState('');
  const [diaSemana, setDiaSemana] = useState('Lunes');
  const [hora, setHora] = useState(new Date());
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);
  const [mostrarDias, setMostrarDias] = useState(false);
  const [errores, setErrores] = useState({});

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const s = useMemo(() => makeStyles(paleta), [paleta]);

  if (!fontsLoaded) return null;
  const horaFormateada = `${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`;

  function validar() {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    else if (nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres.';
    if (!instrumento) e.instrumento = 'Selecciona un instrumento.';
    if (whatsapp && !/^\d{8,15}$/.test(whatsapp.replace(/\s+/g, '')))
      e.whatsapp = 'Solo dígitos, entre 8 y 15 caracteres (ej: 56912345678).';
    if (valorClase && (isNaN(parseInt(valorClase)) || parseInt(valorClase) <= 0))
      e.valorClase = 'Ingresa un valor mayor a 0.';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleGuardar() {
    if (!validar()) return;
    const result = await agregarAlumno({
      nombre: nombre.trim(),
      instrumento: instrumento.nombre,
      avatar: instrumento.emoji,
      whatsapp: whatsapp.trim(),
      valorClase: parseInt(valorClase) || 0,
      diaSemana,
      hora: horaFormateada,
    });
    if (result?.error) {
      Alert.alert('Error', 'No se pudo guardar el alumno. Intenta de nuevo.');
      return;
    }
    router.back();
  }

  function handleCancelar() {
    const dirty = nombre.trim() || instrumento || whatsapp || valorClase;
    if (dirty) {
      Alert.alert('¿Salir sin guardar?', 'Los datos ingresados se perderán.', [
        { text: 'Quedarme', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <TouchableOpacity onPress={handleCancelar} style={s.headerBtn}>
          <Text style={s.headerBtnTexto}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Nuevo Alumno</Text>
        <View style={s.headerBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <Text style={s.label}>Nombre *</Text>
          <TextInput
            style={[s.input, errores.nombre && s.inputError]}
            placeholder="Nombre del alumno"
            placeholderTextColor={paleta.outline}
            value={nombre}
            onChangeText={t => { setNombre(t); if (errores.nombre) setErrores(p => ({ ...p, nombre: null })); }}
          />
          {errores.nombre ? <Text style={s.error}>{errores.nombre}</Text> : null}

          <Text style={s.label}>Instrumento *</Text>
          <View style={s.instrumentosGrid}>
            {INSTRUMENTOS.map(inst => {
              const sel = instrumento?.nombre === inst.nombre;
              return (
                <TouchableOpacity
                  key={inst.nombre}
                  style={[s.instrBtn, sel && s.instrBtnActivo, errores.instrumento && !instrumento && s.instrBtnError]}
                  onPress={() => { setInstrumento(inst); setErrores(p => ({ ...p, instrumento: null })); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.instrEmoji}>{inst.emoji}</Text>
                  <Text style={[s.instrNombre, sel && s.instrNombreActivo]}>{inst.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errores.instrumento ? <Text style={s.error}>{errores.instrumento}</Text> : null}

          <Text style={s.label}>WhatsApp</Text>
          <TextInput
            style={[s.input, errores.whatsapp && s.inputError]}
            placeholder="56912345678"
            placeholderTextColor={paleta.outline}
            value={whatsapp}
            onChangeText={t => { setWhatsapp(t); if (errores.whatsapp) setErrores(p => ({ ...p, whatsapp: null })); }}
            keyboardType="phone-pad"
          />
          {errores.whatsapp ? <Text style={s.error}>{errores.whatsapp}</Text> : null}

          <Text style={s.label}>Valor de la clase (CLP)</Text>
          <TextInput
            style={[s.input, errores.valorClase && s.inputError]}
            placeholder="20000"
            placeholderTextColor={paleta.outline}
            value={valorClase}
            onChangeText={t => { setValorClase(t); if (errores.valorClase) setErrores(p => ({ ...p, valorClase: null })); }}
            keyboardType="numeric"
          />
          {errores.valorClase ? <Text style={s.error}>{errores.valorClase}</Text> : null}

          <Text style={s.label}>Día habitual</Text>
          <TouchableOpacity style={s.selector} onPress={() => setMostrarDias(!mostrarDias)}>
            <Text style={s.selectorTexto}>📅  {diaSemana}</Text>
            <Text style={s.selectorFlecha}>{mostrarDias ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {mostrarDias && (
            <View style={s.diasLista}>
              {DIAS.map(dia => (
                <TouchableOpacity
                  key={dia}
                  style={[s.diaItem, diaSemana === dia && s.diaItemActivo]}
                  onPress={() => { setDiaSemana(dia); setMostrarDias(false); }}
                >
                  <Text style={[s.diaTexto, diaSemana === dia && s.diaTextoActivo]}>{dia}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={s.label}>Hora habitual</Text>
          <TouchableOpacity style={s.selector} onPress={() => setMostrarPickerHora(true)}>
            <Text style={s.selectorTexto}>🕐  {horaFormateada}hs</Text>
            <Text style={s.selectorFlecha}>▼</Text>
          </TouchableOpacity>
          {mostrarPickerHora && (
            <DateTimePicker
              value={hora}
              mode="time"
              display="default"
              minuteInterval={5}
              onChange={(event, d) => {
                setMostrarPickerHora(false);
                if (event.type === 'set' && d) setHora(d);
              }}
            />
          )}

          <TouchableOpacity style={s.btnGuardar} onPress={handleGuardar} activeOpacity={0.85}>
            <Text style={s.btnGuardarTexto}>Guardar Alumno</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnCancelar} onPress={handleCancelar}>
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

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: p.outlineVariant,
      backgroundColor: p.headerBg,
    },
    headerBtn: { width: 40, justifyContent: 'center' },
    headerBtnTexto: { color: p.onSurface, fontSize: 22 },
    headerTitulo: { color: p.onSurface, fontSize: 17, fontFamily: 'Inter_700Bold' },

    label: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 },
    input: {
      backgroundColor: p.bgInput, borderRadius: 12, padding: 14,
      color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular',
      borderWidth: 1, borderColor: p.outlineVariant,
    },
    inputError: { borderColor: p.alert },
    error: { color: p.alert, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },

    instrumentosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    instrBtn: {
      width: '22%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: p.bgInput, borderRadius: 14,
      borderWidth: 1, borderColor: p.outlineVariant,
    },
    instrBtnActivo: { backgroundColor: p.primaryLight, borderColor: p.primary },
    instrBtnError: { borderColor: p.alert },
    instrEmoji: { fontSize: 24, marginBottom: 4 },
    instrNombre: { color: p.onSurfaceVariant, fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
    instrNombreActivo: { color: p.primary },

    selector: {
      backgroundColor: p.bgInput, borderRadius: 12, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderWidth: 1, borderColor: p.outlineVariant,
    },
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

    btnGuardar: {
      backgroundColor: p.primary, borderRadius: 14, height: 52,
      alignItems: 'center', justifyContent: 'center', marginTop: 28,
      shadowColor: p.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
    },
    btnGuardarTexto: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
    btnCancelar: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
    btnCancelarTexto: { color: p.onSurfaceVariant, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  });
}
