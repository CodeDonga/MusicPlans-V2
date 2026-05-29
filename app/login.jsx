import { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { tema, paleta } = useTema();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  if (!fontsLoaded) return null;

  const s = makeStyles(paleta);

  async function handleLogin() {
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoContainer}>
            <Image
              source={require('../assets/logo-inicio-sesion.png')}
              style={{ width: 180, height: 100, resizeMode: 'contain' }}
            />
            <Text style={s.logoSubtitulo}>Gestión de talento musical</Text>
          </View>

          {/* Formulario */}
          <View style={s.form}>
            <Text style={s.formTitulo}>Iniciar Sesión</Text>

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
              placeholder="Tu contraseña"
              placeholderTextColor={paleta.outline}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={s.linkOlvide}>
              <Text style={s.linkTexto}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {error ? <Text style={s.errorTexto}>{error}</Text> : null}

            <TouchableOpacity style={[s.btnPrimario, cargando && { opacity: 0.7 }]} onPress={handleLogin} activeOpacity={0.85} disabled={cargando}>
              {cargando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimarioTexto}>Ingresar</Text>
              }
            </TouchableOpacity>

            <View style={s.separador}>
              <View style={s.separadorLinea} />
              <Text style={s.separadorTexto}>o</Text>
              <View style={s.separadorLinea} />
            </View>

            <TouchableOpacity style={s.btnGoogle} activeOpacity={0.85} onPress={signInWithGoogle}>
              <Text style={s.btnGoogleIcon}>🌐</Text>
              <Text style={s.btnGoogleTexto}>Ingresar con Google</Text>
            </TouchableOpacity>

            <View style={s.registroRow}>
              <Text style={s.registroTexto}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/registro')}>
                <Text style={s.registroLink}>Crear cuenta</Text>
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

    errorTexto: { color: '#ef4444', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 12, textAlign: 'center' },

    linkOlvide: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
    linkTexto: { color: p.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold' },

    btnPrimario: {
      backgroundColor: p.primary, borderRadius: 14, height: 52,
      alignItems: 'center', justifyContent: 'center', marginTop: 20,
      shadowColor: p.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
    },
    btnPrimarioTexto: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },

    separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separadorLinea: { flex: 1, height: 1, backgroundColor: p.outlineVariant },
    separadorTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', marginHorizontal: 12 },

    btnGoogle: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, backgroundColor: p.bgInput, borderRadius: 14, height: 52,
      borderWidth: 1, borderColor: p.outlineVariant,
    },
    btnGoogleIcon: { fontSize: 20 },
    btnGoogleTexto: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_600SemiBold' },

    registroRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    registroTexto: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' },
    registroLink: { color: p.primary, fontSize: 13, fontFamily: 'Inter_700Bold' },
  });
}
