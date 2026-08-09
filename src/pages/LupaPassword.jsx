import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function LupaPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark"></div>
            <div className="auth-brand-name">Kanvas</div>
          </div>
          <div className="auth-title">Cek email kamu 📩</div>
          <div className="auth-subtitle">
            Kalau <b>{email}</b> terdaftar, kami udah kirim link buat bikin kata sandi baru.
            Cek inbox (atau folder spam) kamu.
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
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"></div>
          <div className="auth-brand-name">Kanvas</div>
        </div>

        <div className="auth-title">Lupa kata sandi?</div>
        <div className="auth-subtitle">Masukin email akun kamu, kami kirimin link buat bikin kata sandi baru.</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        <div className="auth-switch">
          <Link to="/login">← Kembali ke halaman masuk</Link>
        </div>
      </div>
    </div>
  )
}
