import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import CustomSelect from '../components/CustomSelect'
import BookingModal from '../components/BookingModal'
import BookingDetailModal from '../components/BookingDetailModal'
import './BookingList.css'

const BULAN_PENUH = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
}
function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}
function initialsOf(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}
function isSelesai(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr) < today
}

export default function BookingList() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterTahun, setFilterTahun] = useState('Semua Tahun')
  const [filterBulan, setFilterBulan] = useState('Semua Bulan')

  const [showModal, setShowModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  async function loadBookings() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('booking_summary')
      .select('*')
      .order('tanggal_acara', { ascending: true })

    if (error) setError(error.message)
    else setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => { loadBookings() }, [])

  const tahunOptions = useMemo(() => {
    const years = new Set(bookings.map((b) => new Date(b.tanggal_acara).getFullYear()))
    years.add(new Date().getFullYear())
    return ['Semua Tahun', ...Array.from(years).sort((a, b) => b - a).map(String)]
  }, [bookings])

  const filtered = bookings.filter((b) => {
    const q = search.trim().toLowerCase()
    if (q) {
      const matches = [b.nama_klien, b.kode_booking, b.event, b.lokasi]
        .some((field) => field?.toLowerCase().includes(q))
      if (!matches) return false
    }
    const d = new Date(b.tanggal_acara)
    if (filterTahun !== 'Semua Tahun' && String(d.getFullYear()) !== filterTahun) return false
    if (filterBulan !== 'Semua Bulan' && BULAN_PENUH[d.getMonth()] !== filterBulan) return false
    return true
  })

  function handleSaved(kode) {
    setShowModal(false)
    loadBookings()
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="greeting">Booking</div>
            <div className="greeting-date">{filtered.length} dari {bookings.length} total booking</div>
          </div>
          <div className="topbar-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Booking Baru
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder="Cari nama klien, kode booking, event, atau lokasi ...."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-select"><CustomSelect options={tahunOptions} value={filterTahun} onChange={setFilterTahun} /></div>
          <div className="filter-select"><CustomSelect options={['Semua Bulan', ...BULAN_PENUH]} value={filterBulan} onChange={setFilterBulan} /></div>
        </div>

        <div className="card table-card">
          {loading && <div className="loading-state">Memuat data...</div>}
          {error && <div className="empty-state" style={{ color: 'var(--coral-tx)' }}>Gagal memuat data: {error}</div>}

          {!loading && !error && (
            filtered.length === 0 ? (
              <div className="empty-state">
                {bookings.length === 0 ? 'Belum ada booking tercatat.' : 'Tidak ada booking yang cocok dengan pencarian/filter.'}
              </div>
            ) : (
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Klien</th>
                    <th>Event</th>
                    <th>Tanggal Acara</th>
                    <th>Lokasi</th>
                    <th className="right">Tagihan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} onClick={() => setSelectedBooking(b)}>
                      <td>
                        <div className="tbl-klien">
                          <div className={`bl-avatar${isSelesai(b.tanggal_acara) ? ' selesai' : ''}`}>{initialsOf(b.nama_klien)}</div>
                          <div>
                            <div className="b-name">{b.nama_klien}</div>
                            <div className="b-meta">
                              {b.kode_booking}
                              {isSelesai(b.tanggal_acara) && <span className="selesai-badge">Selesai</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{b.event || '-'}</td>
                      <td className="mono">{formatTanggal(b.tanggal_acara)}</td>
                      <td>{b.lokasi || '-'}</td>
                      <td className="right mono">{formatRupiah(b.sisa_kekurangan)}</td>
                      <td>
                        <span className={`status-pill ${b.status_pembayaran === 'Lunas' ? 'lunas' : 'belum'}`}>
                          {b.status_pembayaran}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {showModal && (
        <BookingModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}

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
