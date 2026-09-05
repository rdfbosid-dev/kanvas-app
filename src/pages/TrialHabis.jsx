import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { openAdminWhatsApp } from '../lib/whatsapp'
import ThemeToggleButton from '../components/ThemeToggleButton'
import '../pages/Auth.css'

export default function TrialHabis() {
  const { profile, isLocked, signOut } = useAuth()

  // Kalau ternyata akunnya nggak/belum kekunci (misal user coba buka
  // /trial-habis langsung padahal masih aktif), lempar balik ke
  // Dashboard -- halaman ini cuma relevan buat akun yang beneran kekunci.
  if (!isLocked) return <Navigate to="/dashboard" replace />

  function handleHubungiAdmin() {
    const namaStudio = profile?.studio_name || 'Makeup by'
    const pesan = `Halo, Kak! Saya mau lanjut berlangganan Dapur MUA.\n\nNama Brand: ${namaStudio}\n\nMohon info cara pembayarannya ya. Terima kasih!`
    openAdminWhatsApp(pesan)
  }

  return (
    <div className="auth-page">
      <div className="auth-page-toggle"><ThemeToggleButton /></div>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"></div>
          <div className="auth-brand-name">Dapur MUA</div>
        </div>

        <div className="auth-title">Masa Coba Gratis Kamu Udah Habis</div>
        <div className="auth-subtitle">
          Data booking, klien, dan keuangan kamu tetap aman kok, cuma belum bisa diakses
          sementara. Yuk lanjut berlangganan biar bisa lanjut kelola Dapur MUA kamu lagi.
        </div>

        <button className="auth-btn" type="button" onClick={handleHubungiAdmin}>
          Hubungi Admin buat Berlangganan
        </button>

        <div className="auth-switch">
          <a href="#" onClick={(e) => { e.preventDefault(); signOut() }}>Keluar dari akun ini</a>
        </div>
      </div>
    </div>
  )
}
