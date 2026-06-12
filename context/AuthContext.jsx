import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const [recuperandoPassword, setRecuperandoPassword] = useState(false)
  // BUG-28/GC-05: el access token de Google vive solo en memoria como
  // { token, expiresAt }; al vencer se renueva vía la Edge Function calendar-token
  const providerTokenRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') setRecuperandoPassword(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function manejarRecoveryUrl(url) {
      if (!url || !url.includes('type=recovery')) return
      const hash = url.split('#')[1]
      if (!hash) return
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        setRecuperandoPassword(true)
      }
    }
    Linking.getInitialURL().then(manejarRecoveryUrl)
    const sub = Linking.addEventListener('url', ({ url }) => manejarRecoveryUrl(url))
    return () => sub.remove()
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
    providerTokenRef.current = null
  }

  async function updatePerfil(nombre) {
    const { error } = await supabase.auth.updateUser({ data: { nombre } })
    if (error) throw error
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: OAUTH_REDIRECT })
    if (error) throw error
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setRecuperandoPassword(false)
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
    let googleRefreshToken = null
    const hash = result.url.split('#')[1]
    if (hash) {
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
        token = params.get('provider_token')
        googleRefreshToken = params.get('provider_refresh_token')
      }
    }
    if (!token) {
      const { data: sessionData } = await supabase.auth.exchangeCodeForSession(result.url)
      token = sessionData?.session?.provider_token
      googleRefreshToken = sessionData?.session?.provider_refresh_token ?? googleRefreshToken
    }
    if (!token) return false
    providerTokenRef.current = { token, expiresAt: Date.now() + 55 * 60 * 1000 }
    const { data: { session: sesionActual } } = await supabase.auth.getSession()
    const userId = sesionActual?.user?.id
    if (googleRefreshToken && userId) {
      await supabase.from('google_tokens').delete().eq('user_id', userId)
      await supabase.from('google_tokens').insert({ user_id: userId, refresh_token: googleRefreshToken })
    }
    await supabase.auth.updateUser({ data: { google_calendar_connected: true } })
    setSession(prev => prev ? {
      ...prev,
      user: { ...prev.user, user_metadata: { ...prev.user.user_metadata, google_calendar_connected: true } }
    } : prev)
    return true
  }

  async function desconectarCalendar() {
    providerTokenRef.current = null
    const { data: { session: sesionActual } } = await supabase.auth.getSession()
    if (sesionActual?.user?.id) {
      await supabase.from('google_tokens').delete().eq('user_id', sesionActual.user.id)
    }
    await supabase.auth.updateUser({ data: { google_calendar_connected: null } })
    setSession(prev => prev ? {
      ...prev,
      user: { ...prev.user, user_metadata: { ...prev.user.user_metadata, google_calendar_connected: null } }
    } : prev)
  }

  function getCalendarToken() {
    return session?.user?.user_metadata?.google_calendar_connected ?? false
  }

  async function getCalendarAccessToken() {
    const cached = providerTokenRef.current
    if (cached && cached.expiresAt > Date.now() + 60 * 1000) return cached.token

    const { data, error } = await supabase.functions.invoke('calendar-token')
    if (error || !data?.access_token) {
      let codigo = null
      try { codigo = (await error?.context?.json())?.error ?? null } catch {}
      // revoked: el usuario quitó el acceso desde Google; no_token: no hay refresh
      // token guardado (conexión previa a GC-05) — en ambos casos hay que reconectar
      if (__DEV__) console.warn('[gcal] calendar-token sin access token:', codigo ?? error?.message ?? 'sin detalle')
      if (codigo === 'revoked' || codigo === 'no_token') await desconectarCalendar()
      return null
    }
    providerTokenRef.current = {
      token: data.access_token,
      expiresAt: Date.now() + Math.max((data.expires_in ?? 3600) - 300, 60) * 1000,
    }
    return data.access_token
  }

  function clearProviderToken() {
    providerTokenRef.current = null
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, signInWithGoogle, updatePerfil, conectarCalendar, desconectarCalendar, getCalendarToken, getCalendarAccessToken, clearProviderToken, resetPassword, updatePassword, recuperandoPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
