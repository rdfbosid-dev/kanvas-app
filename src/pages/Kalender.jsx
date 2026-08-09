import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import BookingModal from '../components/BookingModal'
import BookingDetailModal from '../components/BookingDetailModal'
import './Kalender.css'

const BULAN_PENUH = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
}
function initialsOf(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}
function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Bikin grid 6x7 (42 sel) buat 1 bulan, termasuk tanggal numpang dari
// bulan sebelum/sesudah biar barisnya selalu penuh.
function buildGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay() // 0 = Minggu
  const gridStart = new Date(year, month, 1 - startWeekday)

  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === month })
  }
  return cells
}

export default function Kalender() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  async function loadBookings() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.from('booking_summary').select('*')
    if (error) setError(error.message)
    else setBookings(data || [])
    setLoading(false)
  }
  useEffect(() => { loadBookings() }, [])

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const bookingsByDay = useMemo(() => {
    const map = new Map()
    bookings.forEach((b) => {
      const d = new Date(b.tanggal_acara)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(b)
    })
    return map
  }, [bookings])

  function dayKey(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }
  function bookingsOn(d) {
    return bookingsByDay.get(dayKey(d)) || []
  }

  function goPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function goNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }
  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDate(today)
  }

  const agendaHariIni = bookingsOn(selectedDate).sort((a, b) => (a.jam_start_makeup || '').localeCompare(b.jam_start_makeup || ''))

  function handleSaved() {
    setShowModal(false)
    loadBookings()
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="greeting">Kalender</div>
            <div className="greeting-date">Lihat & kelola jadwal booking-mu</div>
          </div>
          <div className="topbar-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Booking Baru
            </button>
          </div>
        </div>

        {error && <div className="empty-state" style={{ color: 'var(--coral-tx)' }}>Gagal memuat data: {error}</div>}

        <div className="kalender-layout">
          <div className="card kalender-card">
            <div className="kalender-nav">
              <button className="nav-btn" onClick={goPrevMonth} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className="kalender-title">{BULAN_PENUH[viewMonth]} {viewYear}</div>
              <button className="nav-btn" onClick={goNextMonth} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <button className="today-btn" onClick={goToday} type="button">Hari Ini</button>
            </div>

            <div className="kalender-grid kalender-head">
              {HARI.map((h) => <div key={h} className="kalender-headcell">{h}</div>)}
            </div>

            <div className="kalender-grid">
              {grid.map((cell, i) => {
                const dayBookings = bookingsOn(cell.date)
                const count = dayBookings.length
                const isSelected = sameDate(cell.date, selectedDate)
                const isToday = sameDate(cell.date, today)
                const density = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3
                return (
                  <div
                    key={i}
                    className={`kalender-cell${cell.inMonth ? '' : ' outside'}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedDate(cell.date)}
                  >
                    <div className={`cell-circle density-${density}`}>
                      <span className="cell-date">{cell.date.getDate()}</span>
                      {isToday && <span className="today-dot"></span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card agenda-card">
            <div className="card-head">
              <h3>Agenda {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            </div>
            {loading ? (
              <div className="loading-state">Memuat...</div>
            ) : agendaHariIni.length === 0 ? (
              <div className="empty-state">Tidak ada agenda makeup di tanggal ini.</div>
            ) : (
              agendaHariIni.map((b) => (
                <div className="booking-row" key={b.id} onClick={() => setSelectedBooking(b)} style={{ cursor: 'pointer' }}>
                  <div className="b-avatar">{initialsOf(b.nama_klien)}</div>
                  <div className="b-info">
                    <div className="b-name">{b.nama_klien}</div>
                    <div className="b-meta">
                      {b.event || 'Booking'}{b.jam_start_makeup ? ` · ${b.jam_start_makeup.slice(0, 5)} WIB` : ''}
                    </div>
                  </div>
                  <span className={`status-pill ${b.status_pembayaran === 'Lunas' ? 'lunas' : 'belum'}`}>
                    {b.status_pembayaran}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && <BookingModal onClose={() => setShowModal(false)} onSaved={handleSaved} />}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onChanged={loadBookings}
        />
      )}
    </div>
  )
}
