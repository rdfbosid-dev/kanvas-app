import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const refreshProfile = useCallback(async (userId) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles')
      .select('studio_name, kode_prefix, instagram, whatsapp, logo_url')
      .eq('id', userId)
      .maybeSingle() // beda dari .single() -- nggak error kalau 0 baris, cuma balikin null

    if (data) {
      setProfile(data)
      return
    }

    // Baris profil belum ada (misal akun lama sebelum trigger auto-create
    // dipasang) -- bikinin baru sekarang, biar nggak nyangkut nunggu
    // data yang emang nggak akan pernah datang.
    const fallback = { studio_name: 'Studio Saya', kode_prefix: 'Book', instagram: '', whatsapp: '', logo_url: null }
    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...fallback })
      .select('studio_name, kode_prefix, instagram, whatsapp, logo_url')
      .single()

    setProfile(created || fallback) // tetap kasih nilai walau upsert-nya somehow gagal juga
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
