import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ThemeToggleButton from '../components/ThemeToggleButton'
import './Auth.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    if (password !== confirmPassword) {
      setError('Kata sandi dan konfirmasinya nggak sama.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(
        error.message.includes('session')
          ? 'Link reset udah nggak berlaku atau kadaluarsa. Coba minta link baru lagi.'
          : error.message
      )
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="auth-page">
      <div className="auth-page-toggle"><ThemeToggleButton /></div>
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark"></div>
            <div className="auth-brand-name">Dapur MUA</div>
          </div>
          <div className="auth-title">Kata sandi berhasil diubah ✅</div>
          <div className="auth-subtitle">Kamu sekarang bisa masuk pakai kata sandi barumu.</div>
          <button className="auth-btn" onClick={() => navigate('/dashboard')}>Ke Dashboard</button>
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

        <div className="auth-title">Bikin kata sandi baru</div>
        <div className="auth-subtitle">Pastiin kata sandi barumu aman dan gampang diinget.</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Kata sandi baru</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </div>
          <div className="auth-field">
            <label>Konfirmasi kata sandi</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi barumu"
              required
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
          </button>
        </form>

        <div className="auth-switch">
          <Link to="/login">← Kembali ke halaman masuk</Link>
        </div>
      </div>
    </div>
  )
}
