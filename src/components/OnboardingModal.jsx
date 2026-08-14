import { useNavigate } from 'react-router-dom'
import './OnboardingModal.css'

export default function OnboardingModal({ onClose, onBookingBaru }) {
  const navigate = useNavigate()

  return (
    <div className="modal-overlay onboarding-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="onboard-modal">
        <div className="onboard-hero">
          <div className="onboard-emoji">👋</div>
          <h2>Selamat datang di Dapur MUA!</h2>
          <p>Semua booking, tim, dan uang masuk studiomu, diracik rapi di satu tempat.</p>
        </div>

        <div className="onboard-steps">
          <div className="onboard-step">
            <div className="onboard-step-num">1</div>
            <div>
              <div className="onboard-step-title">Lengkapi profil studio</div>
              <div className="onboard-step-desc">Nama studio, kode booking, kontak — biar semua rapi dari awal.</div>
            </div>
          </div>
          <div className="onboard-step">
            <div className="onboard-step-num">2</div>
            <div>
              <div className="onboard-step-title">Catat booking pertamamu</div>
              <div className="onboard-step-desc">Sekali input, otomatis kehitung omzet, komisi, sampai penghasilan bersih.</div>
            </div>
          </div>
          <div className="onboard-step">
            <div className="onboard-step-num">3</div>
            <div>
              <div className="onboard-step-title">Pantau dari Dashboard</div>
              <div className="onboard-step-desc">Semua tren, klien yang belum lunas, langsung kelihatan sekali buka.</div>
            </div>
          </div>
        </div>

        <div className="onboard-actions">
          <button className="btn-ghost" onClick={() => { onClose(); navigate('/pengaturan') }}>
            Lengkapi Profil Dulu
          </button>
          <button className="btn-primary" onClick={() => { onClose(); onBookingBaru() }}>
            + Buat Booking Pertama
          </button>
        </div>

        <button className="onboard-skip" onClick={onClose}>Lewati, lihat Dashboard dulu</button>
      </div>
    </div>
  )
}
