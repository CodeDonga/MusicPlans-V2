import { createContext, useContext, useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase'

const OAUTH_REDIRECT = `${Constants.expoConfig?.scheme ?? 'musicplans'}://`

WebBrowser.maybeCompleteAuthSession()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, nombre) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function updatePerfil(nombre) {
    const { error } = await supabase.auth.updateUser({ data: { nombre } })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const redirectUrl = OAUTH_REDIRECT
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    })
    if (error) throw error
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
    if (result.type !== 'success') return
    const hash = result.url.split('#')[1]
    if (hash) {
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        return
      }
    }
    await supabase.auth.exchangeCodeForSession(result.url)
  }

  async function conectarCalendar() {
    const redirectUrl = OAUTH_REDIRECT
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) throw error
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
    if (result.type !== 'success') return false
    let token = null
    const hash = result.url.split('#')[1]
    if (hash) {
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const provider_token = params.get('provider_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        token = provider_token
      }
    }
    if (!token) {
      const { data: sessionData } = await supabase.auth.exchangeCodeForSession(result.url)
      token = sessionData?.session?.provider_token
    }
    if (!token) return false
    await supabase.auth.updateUser({ data: { google_calendar_connected: true, google_provider_token: token } })
    setSession(prev => prev ? {
      ...prev,
      user: { ...prev.user, user_metadata: { ...prev.user.user_metadata, google_calendar_connected: true } }
    } : prev)
    return true
  }

  async function desconectarCalendar() {
    await supabase.auth.updateUser({ data: { google_calendar_connected: null } })
    setSession(prev => prev ? {
      ...prev,
      user: { ...prev.user, user_metadata: { ...prev.user.user_metadata, google_calendar_connected: null } }
    } : prev)
  }

  function getCalendarToken() {
    return session?.user?.user_metadata?.google_calendar_connected ?? false
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, signInWithGoogle, updatePerfil, conectarCalendar, desconectarCalendar, getCalendarToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
