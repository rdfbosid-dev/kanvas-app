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
      .select('studio_name, kode_prefix, instagram, whatsapp, logo_url, kode_kalender')
      .eq('id', userId)
      .maybeSingle() // beda dari .single() -- nggak error kalau 0 baris, cuma balikin null

    if (data) {
      setProfile(data)
      return
    }

    // Baris profil belum ada (misal akun lama sebelum trigger auto-create
    // dipasang) -- bikinin baru sekarang, biar nggak nyangkut nunggu
    // data yang emang nggak akan pernah datang.
    const fallback = { studio_name: 'Makeup by', kode_prefix: 'Book', instagram: '', whatsapp: '', logo_url: null, kode_kalender: null }
    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...fallback })
      .select('studio_name, kode_prefix, instagram, whatsapp, logo_url, kode_kalender')
      .single()

    setProfile(created || fallback) // tetap kasih nilai walau upsert-nya somehow gagal juga
  }, [])

  useEffect(() => {
    let active = true

    async function init() {
      // getSession() CUMA baca token yang tersimpan di localStorage --
      // dia nggak nanya ke server sama sekali, jadi tetep "keliatan
      // valid" walau usernya udah dihapus dari Supabase. getUser() beda,
      // itu BENERAN request ke server buat verifikasi -- kalau usernya
      // udah nggak ada, ini yang bakal ke-tangkep errornya.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        if (active) setLoading(false)
        return
      }

      const { data: { user: verifiedUser }, error } = await supabase.auth.getUser()
      if (error || !verifiedUser) {
        // Akun ini udah nggak valid lagi di server (misal: dihapus manual
        // dari Supabase Dashboard) -- bersihin sesi lokal yang "nyangkut"
        // itu, biar route guard di App.jsx otomatis lempar ke /login.
        await supabase.auth.signOut()
        if (active) { setUser(null); setProfile(null); setLoading(false) }
        return
      }

      if (active) {
        setUser(verifiedUser)
        setLoading(false)
        refreshProfile(verifiedUser.id)
      }
    }
    init()

    // dengerin perubahan status login (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) refreshProfile(session.user.id)
      else setProfile(null)
    })

    // Tambahan: verifikasi ulang ke server tiap kali tab ini balik
    // ke-fokus (kejadian nyata yang kita tes: buka Dashboard di 1 tab,
    // user-nya dihapus dari Supabase Dashboard, terus balik ke tab
    // Dashboard tadi -- ini yang nangkep situasi itu tanpa nunggu token
    // lokal expired sendiri, ~1 jam).
    async function revalidateOnFocus() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { error } = await supabase.auth.getUser()
      if (error) await supabase.auth.signOut()
    }
    window.addEventListener('focus', revalidateOnFocus)

    return () => {
      active = false
      listener.subscription.unsubscribe()
      window.removeEventListener('focus', revalidateOnFocus)
    }
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
