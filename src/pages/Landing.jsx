import { Link } from 'react-router-dom'
import ThemeToggleButton from '../components/ThemeToggleButton'
import { openAdminWhatsApp } from '../lib/whatsapp'
import './Landing.css'

const FITUR = [
  {
    icon: 'grid',
    title: 'Dashboard Real-Time',
    desc: 'Lihat omzet, penghasilan, dan booking bulananan cukup sekali buka — lengkap dengan grafik tren dan insight otomatis.',
  },
  {
    icon: 'plus-circle',
    title: 'Booking Multi-Klien',
    desc: 'Fitur satu booking bisa banyak klien, beda paket, beda tim, dan layanan tambahan sendiri.',
  },
  {
    icon: 'calendar',
    title: 'Kalender Visual',
    desc: 'Sinkronisasi jadwal booking dengan kalender di HP-mu, fitur penanda tanggal booking, dan reminder otomatis.',
  },
  {
    icon: 'users',
    title: 'Riwayat Klien',
    desc: 'Semua data klien otomatis terekap — total booking, total belanja, dan riwayat lengkapnya, tanpa ribet.',
  },
  {
    icon: 'trend',
    title: 'Keuangan Otomatis',
    desc: 'Omzet, komisi, dan penghasilan bersih dihitung otomatis dari tiap booking — nggak perlu catat berkali-kali.',
  },
  {
    icon: 'file',
    title: 'Invoice Sekali Klik',
    desc: 'Fitur invoice rapi buat klien, bisa kirim langsung ke WhatsApp klien, atau simpan sebagai arsip.',
  },
]

function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }
  switch (name) {
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
    case 'plus-circle':
      return <svg {...common}><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/></svg>
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3.2"/><path d="M2.7 19.5c0-3.3 2.8-5.8 6.3-5.8s6.3 2.5 6.3 5.8M17 15c1.6.3 2.8 1.6 2.8 3.2"/></svg>
    case 'trend':
      return <svg {...common}><path d="M3 3v18h18"/><path d="M7 14l4-5 3 3 5-7"/></svg>
    case 'file':
      return <svg {...common}><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></svg>
    default:
      return null
  }
}

export default function Landing() {
  function handleHubungiAdmin() {
    openAdminWhatsApp('Halo, Kak!\n\nSaya mau tanya-tanya soal Dapur MUA.')
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-mark"></div>
          <div className="landing-brand-text">
          <span className="landing-brand-title">Dapur MUA</span>
          <span className="landing-brand-tagline">Dashboard Balik Layar Make Up Artist</span>
          </div>
        </div>
        <nav className="landing-nav-links">
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara Kerja</a>
        </nav>
        <div className="landing-nav-actions">
          <ThemeToggleButton />
          <Link to="/login" className="btn-text">Masuk</Link>
          <Link to="/register" className="btn-landing">Coba Gratis</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-badge">Dashboard Balik Layar Make Up Artist</div>
        <h1>Data Booking, Kalender Agenda, dan Keuangan — <span className="hero-accent">diracik rapi di Dapur MUA.</span></h1>
        <p className="hero-sub">
          Dapur MUA bantu kerjamu jadi lebih simpel, rapi, dan terukur.<br />
          Nggak ada lagi data tercecer dan lupa jadwal!
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-landing large">Mulai Gratis Sekarang →</Link>
          <a href="#fitur" className="btn-text large">Lihat fitur ↓</a>
        </div>

        <div className="hero-preview">
          <div className="hp-card hp-kpi">
            <div className="hp-kpi-label">Penghasilan bulan ini</div>
            <div className="hp-kpi-value">Rp5.950.000</div>
            <div className="hp-kpi-sub">↑ 100% dari bulan lalu</div>
          </div>
          <div className="hp-card hp-row">
            <div className="hp-avatar">M</div>
            <div className="hp-row-info">
              <div className="hp-row-name">Mahalini</div>
              <div className="hp-row-meta">Photoshoot · Hari ini</div>
            </div>
            <span className="hp-pill">Belum Lunas</span>
          </div>
          <div className="hp-card hp-row">
            <div className="hp-avatar alt">L</div>
            <div className="hp-row-info">
              <div className="hp-row-name">Lyodra</div>
              <div className="hp-row-meta">Bridesmaid · H-2</div>
            </div>
            <span className="hp-pill lunas">Lunas</span>
          </div>
        </div>
      </section>

      <section className="landing-fitur" id="fitur">
        <div className="section-head">
          <h2>Semua yang MUA butuhin ...</h2>
          <p>dari rekap booking, invoice otomatis, sampai progres usahamu.<br />
          Semuanya dalam satu tempat.</p>
        </div>
        <div className="fitur-grid">
          {FITUR.map((f) => (
            <div className="fitur-card" key={f.title}>
              <div className="fitur-icon"><Icon name={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cara" id="cara-kerja">
        <div className="section-head">
          <h2>Cara kerjanya simpel</h2>
        </div>
        <div className="cara-grid">
          <div className="cara-step">
            <div className="cara-num">1</div>
            <h3>Daftar Akun Dapur MUA</h3>
            <p>Bikin akun gratis dalam hitungan detik, langsung dapat dashboard sendiri.</p>
          </div>
          <div className="cara-step">
            <div className="cara-num">2</div>
            <h3>Input Booking</h3>
            <p>Isi data klien, tanggal acara, event makeup, Dapur MUA yang ngerekap sisanya.</p>
          </div>
          <div className="cara-step">
            <div className="cara-num">3</div>
            <h3>Pantau Progres</h3>
            <p>Lihat data klien, lokasi makeup, tren omzet dan penghasilan untuk pengembangan usahamu cukup dalam satu dashboard.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Siap rapiin bisnis makeup kamu?</h2>
        <p>Gratis buat mulai — nggak perlu ribet.</p>
        <Link to="/register" className="btn-landing large">Coba Dapur MUA Sekarang →</Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand"><div className="brand-mark small"></div><span className="landing-brand-title">Dapur MUA</span></div>
        <p>© 2026 Dapur MUA. Hak cipta dilindungi.</p>
      </footer>

      <button type="button" className="landing-wa-float" onClick={handleHubungiAdmin} aria-label="Hubungi Admin lewat WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.78 14.13c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94s.72-2.09.98-2.38c.25-.28.55-.35.74-.35h.53c.17 0 .4-.06.63.48.24.57.81 1.98.88 2.12.07.14.11.31.02.5-.09.19-.14.31-.28.47-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.35Z"/></svg>
      </button>
    </div>
  )
}
