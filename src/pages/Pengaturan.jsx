import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import './Pengaturan.css'

export default function Pengaturan() {
  const { user, signOut, profile, refreshProfile } = useAuth()

  const [studioName, setStudioName] = useState('')
  const [kodePrefix, setKodePrefix] = useState('')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  useEffect(() => {
    if (profile) {
      setStudioName(profile.studio_name || '')
      setKodePrefix(profile.kode_prefix || '')
      setInstagram(profile.instagram || '')
      setWhatsapp(profile.whatsapp || '')
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    // Jaring pengaman -- kalau karena sebab tak terduga `profile` nggak
    // pernah keisi, jangan biarin loading nyangkut selamanya.
    const timeout = setTimeout(() => setLoading(false), 6000)
    return () => clearTimeout(timeout)
  }, [])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const cleanPrefix = kodePrefix.trim().toUpperCase().slice(0, 5) || 'Book'

    // upsert (bukan update) -- jaga-jaga kalau baris profiles ternyata
    // belum ada, update() akan diam-diam nggak ngapa-ngapain tanpa error.
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        studio_name: studioName.trim() || 'Studio Saya',
        kode_prefix: cleanPrefix,
        instagram: instagram.trim(),
        whatsapp: whatsapp.trim(),
      })

    setSaving(false)
    setKodePrefix(cleanPrefix)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Perubahan berhasil disimpan.' })
      await refreshProfile(user.id) // biar Sidebar (nama studio) langsung ikut update
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi minimal 6 karakter.' })
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) setPasswordMessage({ type: 'error', text: error.message })
    else {
      setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diubah.' })
      setNewPassword('')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="greeting">Pengaturan</div>
            <div className="greeting-date">Kelola Profil Dapur MUA &amp; Akunmu</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : (
          <div className="pengaturan-layout">
            <div className="card">
              <div className="card-head"><h3>Profil Dapur MUA</h3></div>

              {message && (
                <div className={message.type === 'success' ? 'msg-success' : 'msg-error'}>{message.text}</div>
              )}

              <form onSubmit={handleSaveProfile}>
                <div className="field">
                  <label>Nama Brand MUA</label>
                  <input type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="contoh: Makeup by Jenny" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Kode Prefix Booking</label>
                    <input type="text" value={kodePrefix} onChange={(e) => setKodePrefix(e.target.value)} placeholder="contoh: Book" maxLength={5} />
                    <span className="field-hint">Dipakai buat kode otomatis, misal "{kodePrefix || 'Book'}-0001"</span>
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="text" value={user?.email || ''} disabled />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Instagram</label>
                    <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@makeupbyjenny" />
                  </div>
                  <div className="field">
                    <label>Nomor WhatsApp</label>
                    <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="085xxxxxxx" />
                  </div>
                </div>
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>

            <div className="card">
              <div className="card-head"><h3>Ubah Kata Sandi</h3></div>
              {passwordMessage && (
                <div className={passwordMessage.type === 'success' ? 'msg-success' : 'msg-error'}>{passwordMessage.text}</div>
              )}
              <form onSubmit={handleChangePassword}>
                <div className="field">
                  <label>Kata Sandi Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <button className="btn-primary" type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Menyimpan...' : 'Ubah Kata Sandi'}
                </button>
              </form>
            </div>

            <div className="card danger-card">
              <div className="card-head"><h3>Keluar Akun</h3></div>
              <p className="danger-text">Kamu akan keluar dari sesi ini dan perlu login ulang buat mengakses Dapur MUA lagi.</p>
              <button className="btn-keluar-ghost" onClick={signOut} type="button">Keluar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
