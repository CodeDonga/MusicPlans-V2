import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const router = useRouter();
  const { tema, paleta } = useTema();
  const { signUp } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const s = useMemo(() => makeStyles(paleta), [paleta]);

  if (!fontsLoaded) return null;

  async function handleRegistro() {
    if (!nombre || !email || !password || !confirmar) {
      setError('Completa todos los campos.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo válido.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      await signUp(email, password, nombre);
      setExito(true);
    } catch (e) {
      setError(e.message || 'Error al crear la cuenta.');
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <SafeAreaView style={s.contenedor}>
        <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />
        <View style={s.exitoContainer}>
          <Text style={s.exitoIcon}>📬</Text>
          <Text style={s.exitoTitulo}>¡Cuenta creada!</Text>
          <Text style={s.exitoTexto}>Te enviamos un email de confirmación. Revisa tu bandeja y confirma tu cuenta para ingresar.</Text>
          <TouchableOpacity style={s.btnPrimario} onPress={() => router.replace('/login')} activeOpacity={0.85}>
            <Text style={s.btnPrimarioTexto}>Ir al login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.logoContainer}>
            <View style={s.logoIconBox}>
              <Text style={s.logoIcon}>🎵</Text>
            </View>
            <Text style={s.logoTexto}>MusicPlans</Text>
            <Text style={s.logoSubtitulo}>Gestión de talento musical</Text>
          </View>

          <View style={s.form}>
            <Text style={s.formTitulo}>Crear Cuenta</Text>

            <Text style={s.label}>Nombre</Text>
            <TextInput
              style={s.input}
              placeholder="Tu nombre"
              placeholderTextColor={paleta.outline}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />

            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={s.input}
              placeholder="tu@correo.com"
              placeholderTextColor={paleta.outline}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={s.label}>Contraseña</Text>
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

            <TouchableOpacity style={[s.btnPrimario, cargando && { opacity: 0.7 }]} onPress={handleRegistro} activeOpacity={0.85} disabled={cargando}>
              {cargando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimarioTexto}>Crear cuenta</Text>
              }
            </TouchableOpacity>

            <View style={s.loginRow}>
              <Text style={s.loginTexto}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={s.loginLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
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

    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    loginTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' },
    loginLink: { color: p.primary, fontSize: 13, fontFamily: 'Inter_700Bold' },

    exitoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    exitoIcon: { fontSize: 64, marginBottom: 20 },
    exitoTitulo: { color: p.onSurface, fontSize: 24, fontFamily: 'Inter_800ExtraBold', marginBottom: 12, textAlign: 'center' },
    exitoTexto: { color: p.onSurfaceVariant, fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  });
}
