import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useTema } from '../../context/TemaContext';
import { useAuth } from '../../context/AuthContext';
import { useAlumnos } from '../../context/AlumnosContext';

// CT-01: instituciones a las que se puede transferir en Chile y tipos de cuenta.
const BANCOS_CHILE = [
  'BancoEstado', 'Banco de Chile / Edwards', 'Banco Santander', 'Banco BCI',
  'Banco Itaú', 'Scotiabank', 'Scotiabank Azul', 'Banco BICE', 'Banco Security',
  'Banco Falabella', 'Banco Ripley', 'Banco Consorcio', 'Banco Internacional',
  'Banco BTG Pactual', 'HSBC Bank', 'Coopeuch', 'Prepago Los Héroes',
  'Tenpo', 'Mercado Pago', 'MACH', 'Tapp Caja Los Andes',
];
const TIPOS_CUENTA = ['Cuenta Corriente', 'Cuenta Vista', 'Cuenta de Ahorro', 'Chequera Electrónica'];

export default function Ajustes() {
  const { tema, paleta, toggleTema } = useTema();
  const { signOut, session, updatePerfil, updateDatosCobro, conectarCalendar, desconectarCalendar, getCalendarToken } = useAuth();
  const { sincronizarClasesExistentes } = useAlumnos();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });

  const [nombre, setNombre] = useState(session?.user?.user_metadata?.nombre || '');
  const [guardando, setGuardando] = useState(false);
  const [conectandoCalendar, setConectandoCalendar] = useState(false);

  const dc = session?.user?.user_metadata?.datos_cobro || {};
  const [titular, setTitular] = useState(dc.titular || '');
  const [rut, setRut] = useState(dc.rut || '');
  const [banco, setBanco] = useState(dc.banco || '');
  const [tipoCuenta, setTipoCuenta] = useState(dc.tipo_cuenta || '');
  const [numeroCuenta, setNumeroCuenta] = useState(dc.numero_cuenta || '');
  const [emailCobro, setEmailCobro] = useState(dc.email || '');
  const [mostrarBancos, setMostrarBancos] = useState(false);
  const [mostrarTipos, setMostrarTipos] = useState(false);
  const [guardandoCobro, setGuardandoCobro] = useState(false);

  const email = session?.user?.email || '';
  const calendarConectado = !!getCalendarToken();

  const s = useMemo(() => makeStyles(paleta), [paleta]);

  if (!fontsLoaded) return null;

  async function handleConectarCalendar() {
    setConectandoCalendar(true);
    try {
      const ok = await conectarCalendar();
      if (ok) {
        const sincronizadas = await sincronizarClasesExistentes();
        const msg = sincronizadas > 0
          ? `Tus clases se sincronizarán automáticamente.\n${sincronizadas} clase${sincronizadas > 1 ? 's' : ''} existente${sincronizadas > 1 ? 's' : ''} agregada${sincronizadas > 1 ? 's' : ''} al calendario.`
          : 'Tus clases se sincronizarán automáticamente.';
        Alert.alert('Google Calendar conectado', msg);
      } else {
        Alert.alert('No conectado', 'Intenta de nuevo.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo conectar.');
    } finally {
      setConectandoCalendar(false);
    }
  }

  async function handleGuardarPerfil() {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre.');
      return;
    }
    setGuardando(true);
    try {
      await updatePerfil(nombre.trim());
      Alert.alert('Perfil actualizado', 'Tu nombre fue guardado correctamente.');
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarCobro() {
    if (!titular.trim() || !rut.trim() || !banco || !tipoCuenta || !numeroCuenta.trim()) {
      Alert.alert('Faltan datos', 'Completa nombre, RUT, banco, tipo de cuenta y número de cuenta.');
      return;
    }
    setGuardandoCobro(true);
    try {
      await updateDatosCobro({
        titular: titular.trim(),
        rut: rut.trim(),
        banco,
        tipo_cuenta: tipoCuenta,
        numero_cuenta: numeroCuenta.trim(),
        email: emailCobro.trim(),
      });
      Alert.alert('Datos de cobro guardados', 'Se incluirán en tus mensajes de cobro por WhatsApp.');
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron guardar los datos.');
    } finally {
      setGuardandoCobro(false);
    }
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <View style={s.headerBrand}>
          <Text style={s.headerIcon}>🎵</Text>
          <Text style={s.headerLogo}>MusicPlans</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
        <View style={s.seccionTituloContainer}>
          <Text style={s.seccionLabel}>Preferencias</Text>
          <Text style={s.seccionTitulo}>Ajustes</Text>
        </View>

        {/* Perfil */}
        <Text style={s.grupoLabel}>Perfil del profesor</Text>
        <View style={s.card}>
          <View style={s.campoRow}>
            <Text style={s.campoIcon}>👤</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>Nombre</Text>
              <TextInput
                style={s.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                placeholderTextColor={paleta.onSurfaceVariant}
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={s.divisor} />
          <View style={s.campoRow}>
            <Text style={s.campoIcon}>✉️</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>Email</Text>
              <Text style={s.emailTexto}>{email}</Text>
            </View>
          </View>
          <View style={s.divisor} />
          <TouchableOpacity style={s.btnGuardar} onPress={handleGuardarPerfil} activeOpacity={0.8} disabled={guardando}>
            {guardando
              ? <ActivityIndicator color="#ffffff" size="small" />
              : <Text style={s.btnGuardarTexto}>Guardar cambios</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Datos de cobro */}
        <Text style={s.grupoLabel}>Datos de cobro</Text>
        <View style={s.card}>
          <View style={s.campoRow}>
            <Text style={s.campoIcon}>👤</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>Nombre</Text>
              <TextInput style={s.input} value={titular} onChangeText={setTitular} placeholder="Nombre del titular" placeholderTextColor={paleta.onSurfaceVariant} />
            </View>
          </View>
          <View style={s.divisor} />
          <View style={s.campoRow}>
            <Text style={s.campoIcon}>🪪</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>RUT</Text>
              <TextInput style={s.input} value={rut} onChangeText={setRut} placeholder="12.345.678-9" placeholderTextColor={paleta.onSurfaceVariant} autoCapitalize="none" />
            </View>
          </View>
          <View style={s.divisor} />
          <TouchableOpacity style={s.campoRow} onPress={() => { setMostrarBancos(!mostrarBancos); setMostrarTipos(false); }} activeOpacity={0.7}>
            <Text style={s.campoIcon}>🏦</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>Banco</Text>
              <Text style={banco ? s.selectorValor : s.selectorPlaceholder}>{banco || 'Selecciona tu banco'}</Text>
            </View>
            <Text style={s.opcionFlecha}>{mostrarBancos ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {mostrarBancos && (
            <View style={s.dropdownLista}>
              {BANCOS_CHILE.map(b => (
                <TouchableOpacity key={b} style={s.dropdownOpcion} onPress={() => { setBanco(b); setMostrarBancos(false); }} activeOpacity={0.7}>
                  <Text style={[s.dropdownOpcionTexto, banco === b && s.dropdownOpcionTextoActivo]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.divisor} />
          <TouchableOpacity style={s.campoRow} onPress={() => { setMostrarTipos(!mostrarTipos); setMostrarBancos(false); }} activeOpacity={0.7}>
            <Text style={s.campoIcon}>💳</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>Tipo de cuenta</Text>
              <Text style={tipoCuenta ? s.selectorValor : s.selectorPlaceholder}>{tipoCuenta || 'Selecciona el tipo'}</Text>
            </View>
            <Text style={s.opcionFlecha}>{mostrarTipos ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {mostrarTipos && (
            <View style={s.dropdownLista}>
              {TIPOS_CUENTA.map(t => (
                <TouchableOpacity key={t} style={s.dropdownOpcion} onPress={() => { setTipoCuenta(t); setMostrarTipos(false); }} activeOpacity={0.7}>
                  <Text style={[s.dropdownOpcionTexto, tipoCuenta === t && s.dropdownOpcionTextoActivo]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.divisor} />
          <View style={s.campoRow}>
            <Text style={s.campoIcon}>#️⃣</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>N° de cuenta</Text>
              <TextInput style={s.input} value={numeroCuenta} onChangeText={setNumeroCuenta} placeholder="000123456789" placeholderTextColor={paleta.onSurfaceVariant} keyboardType="numeric" />
            </View>
          </View>
          <View style={s.divisor} />
          <View style={s.campoRow}>
            <Text style={s.campoIcon}>✉️</Text>
            <View style={s.campoInner}>
              <Text style={s.campoLabel}>Email (opcional)</Text>
              <TextInput style={s.input} value={emailCobro} onChangeText={setEmailCobro} placeholder="tu@email.com" placeholderTextColor={paleta.onSurfaceVariant} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <View style={s.divisor} />
          <TouchableOpacity style={s.btnGuardar} onPress={handleGuardarCobro} activeOpacity={0.8} disabled={guardandoCobro}>
            {guardandoCobro
              ? <ActivityIndicator color="#ffffff" size="small" />
              : <Text style={s.btnGuardarTexto}>Guardar datos de cobro</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Apariencia */}
        <Text style={s.grupoLabel}>Apariencia</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={[s.opcion, tema === 'oscuro' && s.opcionActiva]}
            onPress={() => toggleTema('oscuro')}
            activeOpacity={0.75}
          >
            <Text style={s.opcionIcon}>🌙</Text>
            <Text style={[s.opcionTexto, tema === 'oscuro' && s.opcionTextoActivo]}>Modo Oscuro</Text>
            {tema === 'oscuro' && <Text style={s.opcionCheck}>✓</Text>}
          </TouchableOpacity>
          <View style={s.divisor} />
          <TouchableOpacity
            style={[s.opcion, tema === 'claro' && s.opcionActiva]}
            onPress={() => toggleTema('claro')}
            activeOpacity={0.75}
          >
            <Text style={s.opcionIcon}>☀️</Text>
            <Text style={[s.opcionTexto, tema === 'claro' && s.opcionTextoActivo]}>Modo Claro</Text>
            {tema === 'claro' && <Text style={s.opcionCheck}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Integraciones */}
        <Text style={s.grupoLabel}>Integraciones</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.opcion}
            onPress={calendarConectado ? null : handleConectarCalendar}
            activeOpacity={calendarConectado ? 1 : 0.75}
            disabled={conectandoCalendar}
          >
            <Text style={s.opcionIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.opcionTexto, calendarConectado && { color: paleta.success }]}>
                {calendarConectado ? 'Google Calendar conectado' : 'Conectar Google Calendar'}
              </Text>
              <Text style={{ color: paleta.onSurfaceVariant, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
                {calendarConectado ? 'Las clases se sincronizan automáticamente' : 'Sincroniza tus clases con Google Calendar'}
              </Text>
            </View>
            {conectandoCalendar
              ? <ActivityIndicator size="small" color={paleta.primary} />
              : calendarConectado
                ? <Text style={{ color: paleta.success, fontSize: 16 }}>✓</Text>
                : <Text style={s.opcionFlecha}>›</Text>
            }
          </TouchableOpacity>
          {calendarConectado && (
            <>
              <View style={s.divisor} />
              <TouchableOpacity
                style={s.opcion}
                onPress={() => Alert.alert(
                  'Desconectar Calendar',
                  '¿Seguro? Las clases nuevas no se sincronizarán hasta que vuelvas a conectar.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desconectar', style: 'destructive', onPress: desconectarCalendar },
                  ]
                )}
                activeOpacity={0.75}
              >
                <Text style={s.opcionIcon}>🔗</Text>
                <Text style={[s.opcionTexto, { color: paleta.alert }]}>Desconectar Google Calendar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Cuenta */}
        <Text style={s.grupoLabel}>Cuenta</Text>
        <View style={s.card}>
          <View style={s.opcion}>
            <Text style={s.opcionIcon}>💳</Text>
            <Text style={s.opcionTexto}>Suscripción</Text>
            <Text style={s.opcionFlecha}>›</Text>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={s.btnCerrarSesion}
          onPress={() => Alert.alert(
            'Cerrar sesión',
            '¿Seguro que quieres cerrar sesión?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
            ]
          )}
          activeOpacity={0.8}
        >
          <Text style={s.btnCerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={s.version}>MusicPlans v2.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: p.headerBg, borderBottomWidth: 1, borderBottomColor: p.outlineVariant },
    headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { fontSize: 22 },
    headerLogo: { color: p.primary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    seccionTituloContainer: { paddingTop: 20, paddingBottom: 8 },
    seccionLabel: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    seccionTitulo: { color: p.onSurface, fontSize: 36, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 },
    contenido: { paddingHorizontal: 16, paddingBottom: 32 },
    grupoLabel: { color: p.onSurfaceVariant, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
    card: { backgroundColor: p.bgCard, borderRadius: 16, borderWidth: 1, borderColor: p.outlineVariant, overflow: 'hidden' },
    campoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    campoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
    campoInner: { flex: 1 },
    campoLabel: { color: p.onSurfaceVariant, fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    input: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 0 },
    emailTexto: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular' },
    btnGuardar: { margin: 12, backgroundColor: p.primary, borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center' },
    btnGuardarTexto: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter_700Bold' },
    opcion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
    opcionActiva: { backgroundColor: p.primaryLight },
    opcionIcon: { fontSize: 20, width: 28, textAlign: 'center' },
    opcionTexto: { flex: 1, color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular' },
    opcionTextoActivo: { color: p.primary, fontFamily: 'Inter_600SemiBold' },
    opcionCheck: { color: p.primary, fontSize: 16, fontFamily: 'Inter_700Bold' },
    opcionFlecha: { color: p.onSurfaceVariant, fontSize: 20 },
    selectorValor: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular' },
    selectorPlaceholder: { color: p.onSurfaceVariant, fontSize: 15, fontFamily: 'Inter_400Regular' },
    dropdownLista: { backgroundColor: p.bgInput, marginHorizontal: 16, marginTop: 4, borderRadius: 10, borderWidth: 1, borderColor: p.outlineVariant, overflow: 'hidden' },
    dropdownOpcion: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: p.outlineVariant },
    dropdownOpcionTexto: { color: p.onSurface, fontSize: 14, fontFamily: 'Inter_400Regular' },
    dropdownOpcionTextoActivo: { color: p.primary, fontFamily: 'Inter_700Bold' },
    divisor: { height: 1, backgroundColor: p.outlineVariant, marginHorizontal: 16 },
    btnCerrarSesion: { marginTop: 32, backgroundColor: p.alertFaint, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.alert },
    btnCerrarSesionTexto: { color: p.alert, fontSize: 15, fontFamily: 'Inter_700Bold' },
    version: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 24 },
  });
}
