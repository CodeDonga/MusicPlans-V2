import { useEffect } from 'react'
import { LogBox } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { TemaProvider } from '../context/TemaContext'
import { AlumnosProvider } from '../context/AlumnosContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { configurarNotificaciones, solicitarPermisos } from '../lib/notificaciones'

// SDK 53 removió push remoto de Expo Go; solo usamos notificaciones locales
LogBox.ignoreLogs(['expo-notifications: Android Push notifications'])

configurarNotificaciones()

function AuthGate() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (session) solicitarPermisos()
  }, [session])

  useEffect(() => {
    if (loading) return
    const rutasPublicas = ['login', 'registro']
    if (!session && !rutasPublicas.includes(segments[0])) {
      router.replace('/login')
    } else if (session && rutasPublicas.includes(segments[0])) {
      router.replace('/(tabs)/agenda')
    }
  }, [session, loading, segments])

  return null
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <AuthProvider>
        <AlumnosProvider>
          <AuthGate />
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="registro" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="nuevo-alumno" options={{ headerShown: false }} />
            <Stack.Screen name="nuevo-taller" options={{ headerShown: false }} />
          </Stack>
        </AlumnosProvider>
      </AuthProvider>
    </TemaProvider>
  )
}
