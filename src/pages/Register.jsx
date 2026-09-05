import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ThemeToggleButton from '../components/ThemeToggleButton'
import './Auth.css'

export default function Register() {
  const [studioName, setStudioName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // Supabase SENGAJA nggak ngasih error kalau signUp() dipanggil pakai
    // email yang udah kedaftar & udah konfirmasi -- ini demi keamanan
    // (biar orang nggak bisa "nebak" email mana aja yang udah kedaftar
    // di sistem). Tapi ada sinyal buat bedainnya: kalau `identities`
    // kosong ([]), itu tandanya BUKAN akun baru -- email-nya emang
    // udah ada, dan nggak ada email konfirmasi apapun yang beneran
    // terkirim barusan.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false)
      setError('Email ini udah terdaftar. Coba masuk, atau pakai "Lupa kata sandi?" kalau lupa kata sandinya.')
      return
    }

    // simpan nama studio ke tabel profiles (baris profiles-nya sendiri
    // udah otomatis dibuat oleh trigger di database begitu user baru daftar)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ studio_name: studioName || 'Makeup by' })
        .eq('id', data.user.id)
    }

    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-page">
      <div className="auth-page-toggle"><ThemeToggleButton /></div>
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark"></div>
            <div className="auth-brand-name">Dapur MUA</div>
          </div>
          <div className="auth-title">Cek email kamu 📩</div>
          <div className="auth-subtitle">
            Kami udah kirim link konfirmasi ke <b>{email}</b>. Klik link itu dulu,
            baru kamu bisa login.
          </div>
          <div className="auth-switch">
            <Link to="/login">Kembali ke halaman masuk</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-page-toggle"><ThemeToggleButton /></div>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"></div>
          <div className="auth-brand-name">Dapur MUA</div>
        </div>

        <div className="auth-title">Buat Akun Baru</div>
        <div className="auth-subtitle">Mulai kelola dashboard MUA cukup dalam 1 menit</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <div className="auth-field-control">
              <input
                id="register-studio"
                name="organization"
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder=" "
                autoComplete="organization"
              />
              <label htmlFor="register-studio">Nama Brand MUA</label>
            </div>
          </div>
          <div className="auth-field">
            <div className="auth-field-control">
              <input
                id="register-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                autoComplete="email"
                required
              />
              <label htmlFor="register-email">Email</label>
            </div>
          </div>
          <div className="auth-field">
            <div className="auth-field-control">
              <input
                id="register-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="new-password"
                required
              />
              <label htmlFor="register-password">Kata sandi</label>
            </div>
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="auth-switch">
          Udah punya akun? <Link to="/login">Masuk di sini</Link>
        </div>
      </div>
    </div>
  )
}
