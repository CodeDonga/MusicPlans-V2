import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';

export default function NuevaContrasena() {
  const router = useRouter();
  const { tema, paleta } = useTema();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const s = useMemo(() => makeStyles(paleta), [paleta]);

  if (!fontsLoaded) return null;

  async function handleGuardar() {
    if (!password || !confirmar) {
      setError('Completa ambos campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      await updatePassword(password);
      Alert.alert('Contraseña actualizada', 'Ya puedes usar tu nueva contraseña.');
      router.replace('/(tabs)/agenda');
    } catch (e) {
      setError(e.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.logoContainer}>
            <View style={s.logoIconBox}>
              <Text style={s.logoIcon}>🔑</Text>
            </View>
            <Text style={s.logoTexto}>MusicPlans</Text>
            <Text style={s.logoSubtitulo}>Restablecer contraseña</Text>
          </View>

          <View style={s.form}>
            <Text style={s.formTitulo}>Nueva Contraseña</Text>

            <Text style={s.label}>Nueva contraseña</Text>
            <TextInput
              style={s.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={paleta.outline}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={s.label}>Confirmar contraseña</Text>
            <TextInput
              style={s.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor={paleta.outline}
              value={confirmar}
              onChangeText={setConfirmar}
              secureTextEntry
            />

            {error ? <Text style={s.errorTexto}>{error}</Text> : null}

            <TouchableOpacity style={[s.btnPrimario, cargando && { opacity: 0.7 }]} onPress={handleGuardar} activeOpacity={0.85} disabled={cargando}>
              {cargando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimarioTexto}>Guardar contraseña</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoIconBox: {
      width: 72, height: 72, borderRadius: 20,
      backgroundColor: p.primaryFaint, borderWidth: 1, borderColor: p.primaryBorder,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    logoIcon: { fontSize: 36 },
    logoTexto: { color: p.primary, fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    logoSubtitulo: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },

    form: {
      backgroundColor: p.bgCard,
      borderRadius: 24, padding: 24,
      borderWidth: 1, borderColor: p.outlineVariant,
    },
    formTitulo: { color: p.onSurface, fontSize: 20, fontFamily: 'Inter_800ExtraBold', marginBottom: 20, textAlign: 'center' },

    label: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
    input: {
      backgroundColor: p.bgInput, borderRadius: 12, padding: 14,
      color: p.onSurface, fontSize: 15, fontFamily: 'Inter_400Regular',
      borderWidth: 1, borderColor: p.outlineVariant,
    },

    errorTexto: { color: p.alert, fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 12, textAlign: 'center' },

    btnPrimario: {
      backgroundColor: p.primary, borderRadius: 14, height: 52,
      alignItems: 'center', justifyContent: 'center', marginTop: 20,
      shadowColor: p.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
    },
    btnPrimarioTexto: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  });
}
