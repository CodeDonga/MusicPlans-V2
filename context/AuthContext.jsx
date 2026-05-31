import { createContext, useContext, useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../lib/supabase'

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
    const redirectUrl = Linking.createURL('/')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    })
    if (error) throw error
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
    if (result.type === 'success') {
      await supabase.auth.exchangeCodeForSession(result.url)
    }
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, signInWithGoogle, updatePerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
