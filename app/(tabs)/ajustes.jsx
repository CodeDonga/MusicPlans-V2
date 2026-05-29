import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useTema } from '../../context/TemaContext';
import { useAuth } from '../../context/AuthContext';

export default function Ajustes() {
  const { tema, paleta, toggleTema } = useTema();
  const { signOut } = useAuth();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  if (!fontsLoaded) return null;

  const s = makeStyles(paleta);

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <View style={s.headerBrand}>
          <Text style={s.headerIcon}>🎵</Text>
          <Text style={s.headerLogo}>MusicPlans</Text>
        </View>
      </View>

      <View style={s.seccionTituloContainer}>
        <Text style={s.seccionLabel}>Preferencias</Text>
        <Text style={s.seccionTitulo}>Ajustes</Text>
      </View>

      <View style={s.contenido}>

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

        {/* Cuenta */}
        <Text style={s.grupoLabel}>Cuenta</Text>
        <View style={s.card}>
          <View style={s.opcion}>
            <Text style={s.opcionIcon}>👤</Text>
            <Text style={s.opcionTexto}>Perfil del profesor</Text>
            <Text style={s.opcionFlecha}>›</Text>
          </View>
          <View style={s.divisor} />
          <View style={s.opcion}>
            <Text style={s.opcionIcon}>💳</Text>
            <Text style={s.opcionTexto}>Suscripción</Text>
            <Text style={s.opcionFlecha}>›</Text>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={s.btnCerrarSesion} onPress={signOut} activeOpacity={0.8}>
          <Text style={s.btnCerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={s.version}>MusicPlans v2.0</Text>
      </View>
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
    seccionTituloContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    seccionLabel: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    seccionTitulo: { color: p.onSurface, fontSize: 36, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 },
    contenido: { paddingHorizontal: 16, paddingTop: 16 },
    grupoLabel: { color: p.onSurfaceVariant, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
    card: { backgroundColor: p.bgCard, borderRadius: 16, borderWidth: 1, borderColor: p.outlineVariant, overflow: 'hidden' },
    opcion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 12 },
    opcionActiva: { backgroundColor: p.primaryLight },
    opcionIcon: { fontSize: 20, width: 28, textAlign: 'center' },
    opcionTexto: { flex: 1, color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular' },
    opcionTextoActivo: { color: p.primary, fontFamily: 'Inter_600SemiBold' },
    opcionCheck: { color: p.primary, fontSize: 16, fontFamily: 'Inter_700Bold' },
    opcionFlecha: { color: p.onSurfaceVariant, fontSize: 20 },
    divisor: { height: 1, backgroundColor: p.outlineVariant, marginHorizontal: 16 },
    btnCerrarSesion: { marginTop: 32, backgroundColor: p.alertFaint, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.alert },
    btnCerrarSesionTexto: { color: p.alert, fontSize: 15, fontFamily: 'Inter_700Bold' },
    version: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 24 },
  });
}
