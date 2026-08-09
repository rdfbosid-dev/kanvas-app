import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email atau kata sandi salah.'
        : error.message)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"></div>
          <div className="auth-brand-name">Kanvas</div>
        </div>

        <div className="auth-title">Masuk</div>
        <div className="auth-subtitle">Kelola booking &amp; keuangan studiomu di sini.</div>

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
          <div className="auth-field">
            <label>Kata sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </div>
      </div>
    </div>
  )
}
