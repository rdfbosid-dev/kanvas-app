import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const refreshProfile = useCallback(async (userId) => {
    const id = userId
    if (!id) return
    const { data } = await supabase
      .from('profiles')
      .select('studio_name, kode_prefix, instagram, whatsapp')
      .eq('id', id)
      .single()
    if (data) setProfile(data)
  }, [])

  useEffect(() => {
    // cek sesi yang mungkin udah ada (misal user refresh halaman)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) refreshProfile(session.user.id)
    })

    // dengerin perubahan status login (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) refreshProfile(session.user.id)
      else setProfile(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [refreshProfile])

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signOut, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
