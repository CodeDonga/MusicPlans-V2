import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { TemaProvider } from '../context/TemaContext'
import { AlumnosProvider } from '../context/AlumnosContext'
import { AuthProvider, useAuth } from '../context/AuthContext'

function AuthGate() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const rutasPublicas = ['login', 'registro']
    if (!session && !rutasPublicas.includes(segments[0])) {
      router.replace('/login')
    } else if (session && rutasPublicas.includes(segments[0])) {
      router.replace('/(tabs)')
    }
  }, [session, loading, segments])

  return null
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <AlumnosProvider>
        <AuthProvider>
          <AuthGate />
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="registro" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="perfil" options={{ headerShown: false }} />
            <Stack.Screen name="nuevo-alumno" options={{ headerShown: false }} />
            <Stack.Screen name="nuevo-taller" options={{ headerShown: false }} />
            <Stack.Screen name="finanzas" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </AlumnosProvider>
    </TemaProvider>
  )
}
