import { Link } from 'react-router-dom'
import ThemeToggleButton from '../components/ThemeToggleButton'
import './Landing.css'

const FITUR = [
  {
    icon: 'grid',
    title: 'Dashboard Real-Time',
    desc: 'Lihat omzet, penghasilan, dan booking bulan ini sekali buka — lengkap dengan grafik tren dan insight otomatis.',
  },
  {
    icon: 'plus-circle',
    title: 'Booking Multi-Peserta',
    desc: 'Satu booking bisa ada banyak peserta, masing-masing dengan paket, tim pengerja, dan layanan tambahan sendiri.',
  },
  {
    icon: 'calendar',
    title: 'Kalender Visual',
    desc: 'Lihat jadwal sebulan penuh, warna otomatis nunjukin hari mana yang santai, agak padat, atau padat.',
  },
  {
    icon: 'users',
    title: 'Riwayat Klien',
    desc: 'Semua klien otomatis terekap — total booking, total belanja, dan riwayat lengkapnya, tanpa input manual.',
  },
  {
    icon: 'trend',
    title: 'Keuangan Otomatis',
    desc: 'Omzet, komisi tim, dan penghasilan bersih dihitung otomatis dari tiap booking — nggak perlu Excel lagi.',
  },
  {
    icon: 'file',
    title: 'Invoice Sekali Klik',
    desc: 'Buat invoice rapi buat klien, kirim langsung ke WhatsApp atau simpan sebagai PDF.',
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
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="brand-mark"></div>
          <span>Dapur MUA</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara Kerja</a>
        </nav>
        <div className="landing-nav-actions">
          <ThemeToggleButton />
          <Link to="/login" className="btn-text">Masuk</Link>
          <Link to="/register" className="btn-primary">Coba Gratis</Link>
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
          <Link to="/register" className="btn-primary large">Mulai Gratis Sekarang →</Link>
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
          <h2>Semua yang MUA butuhin</h2>
          <p>Dari rekap booking, invoice otomatis, sampai progres usahamu.<br />
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
            <h3>Daftar akun studio</h3>
            <p>Bikin akun gratis dalam hitungan detik, langsung dapat Dashboard sendiri.</p>
          </div>
          <div className="cara-step">
            <div className="cara-num">2</div>
            <h3>Catat booking</h3>
            <p>Isi data klien, peserta, dan tim yang ngerjain — Dapur MUA yang ngitungin sisanya.</p>
          </div>
          <div className="cara-step">
            <div className="cara-num">3</div>
            <h3>Pantau &amp; berkembang</h3>
            <p>Lihat tren omzet, klien yang belum lunas, dan performa studio dari Dashboard.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Siap rapiin bisnis makeup kamu?</h2>
        <p>Gratis buat mulai — nggak perlu kartu kredit.</p>
        <Link to="/register" className="btn-primary large">Coba Dapur MUA Sekarang →</Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand"><div className="brand-mark small"></div><span>Dapur MUA</span></div>
        <p>© 2026 Dapur MUA. Hak cipta dilindungi. Dibuat buat makeup artist Indonesia.</p>
      </footer>
    </div>
  )
}
