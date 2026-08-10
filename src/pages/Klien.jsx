import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import BookingDetailModal from '../components/BookingDetailModal'
import './Klien.css'

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
}
function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function initialsOf(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Klien() {
  const [bookings, setBookings] = useState([])
  const [klienRows, setKlienRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')
    const [bookingRes, klienRes] = await Promise.all([
      supabase.from('booking_summary').select('*').order('tanggal_acara', { ascending: false }),
      supabase.from('klien').select('id, nama, nomor_whatsapp'),
    ])
    if (bookingRes.error) setError(bookingRes.error.message)
    else if (klienRes.error) setError(klienRes.error.message)
    else {
      setBookings(bookingRes.data || [])
      setKlienRows(klienRes.data || [])
    }
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  // Kelompokkan booking berdasarkan klien_id (ID unik asli dari tabel klien)
  // -- bukan lagi nebak dari kesamaan nama. Jadi 2 klien beda orang yang
  // kebetulan namanya sama (nomor WA beda) bakal tetap muncul sebagai
  // 2 kartu terpisah.
  const clients = useMemo(() => {
    const map = new Map()
    klienRows.forEach((k) => {
      map.set(k.id, {
        id: k.id,
        nama: k.nama,
        whatsapp: k.nomor_whatsapp,
        bookingList: [],
        totalBelanja: 0,
        totalSisa: 0,
        lastTanggal: null,
      })
    })

    // Fallback buat booking lama yang belum ke-link klien_id-nya (mestinya
    // sudah dibackfill lewat migrasi, tapi dijaga di sini biar nggak ada
    // booking yang "hilang" dari halaman ini kalau ada yang kelewat).
    let fallbackKlienCounter = 0
    const fallbackMap = new Map()

    bookings.forEach((b) => {
      let clientKey = b.klien_id
      if (!clientKey || !map.has(clientKey)) {
        const nameKey = (b.nama_klien || '').trim().toLowerCase()
        if (!nameKey) return
        if (!fallbackMap.has(nameKey)) {
          fallbackKlienCounter += 1
          fallbackMap.set(nameKey, `fallback-${fallbackKlienCounter}`)
          map.set(fallbackMap.get(nameKey), {
            id: fallbackMap.get(nameKey),
            nama: b.nama_klien,
            whatsapp: b.nomor_whatsapp,
            bookingList: [],
            totalBelanja: 0,
            totalSisa: 0,
            lastTanggal: null,
          })
        }
        clientKey = fallbackMap.get(nameKey)
      }

      const c = map.get(clientKey)
      c.bookingList.push(b)
      c.totalBelanja += Number(b.belanja_klien) || 0
      c.totalSisa += Number(b.sisa_kekurangan) || 0
      if (!c.lastTanggal || new Date(b.tanggal_acara) > new Date(c.lastTanggal)) c.lastTanggal = b.tanggal_acara
    })

    return Array.from(map.values())
      .filter((c) => c.bookingList.length > 0)
      .sort((a, b) => new Date(b.lastTanggal) - new Date(a.lastTanggal))
  }, [bookings, klienRows])

  const filtered = clients.filter((c) =>
    !search.trim() || c.nama?.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="greeting">Klien</div>
            <div className="greeting-date">{clients.length} klien unik tercatat</div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="text" placeholder="Cari nama klien..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <div className="empty-state" style={{ color: 'var(--coral-tx)' }}>Gagal memuat data: {error}</div>}
        {loading && <div className="loading-state">Memuat data...</div>}

        {!loading && !error && (
          filtered.length === 0 ? (
            <div className="card"><div className="empty-state">
              {clients.length === 0 ? 'Belum ada klien tercatat.' : 'Tidak ada klien yang cocok dengan pencarian.'}
            </div></div>
          ) : (
            <div className="klien-grid">
              {filtered.map((c) => (
                <div className="klien-card" key={c.id} onClick={() => setSelectedClient(c)}>
                  <div className="b-avatar big">{initialsOf(c.nama)}</div>
                  <div className="klien-name">{c.nama}</div>
                  <div className="klien-wa">{c.whatsapp || '-'}</div>
                  <div className="klien-stats">
                    <div><span className="klien-stat-val">{c.bookingList.length}</span><span className="klien-stat-lab">Booking</span></div>
                    <div><span className="klien-stat-val">{formatRupiah(c.totalBelanja)}</span><span className="klien-stat-lab">Total Belanja</span></div>
                  </div>
                  {c.totalSisa > 0 && (
                    <span className="status-pill belum klien-outstanding">Sisa {formatRupiah(c.totalSisa)}</span>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {selectedClient && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedClient(null) }}>
          <div className="modal">
            <div className="modal-head">
              <h2>{selectedClient.nama}</h2>
              <button className="modal-close" onClick={() => setSelectedClient(null)} type="button">&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: 18 }}>
                <div><span className="detail-label">No. WhatsApp</span><div>{selectedClient.whatsapp || '-'}</div></div>
                <div><span className="detail-label">Total Booking</span><div>{selectedClient.bookingList.length}</div></div>
                <div><span className="detail-label">Total Belanja</span><div>{formatRupiah(selectedClient.totalBelanja)}</div></div>
                <div><span className="detail-label">ID Klien</span><div style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedClient.id.slice(0, 8)}</div></div>
              </div>
              <div className="section-label">Riwayat Booking</div>
              {selectedClient.bookingList.map((b) => (
                <div className="booking-row" key={b.id} onClick={() => setSelectedBooking(b)} style={{ cursor: 'pointer' }}>
                  <div className="b-avatar">{b.event?.slice(0, 2).toUpperCase() || '??'}</div>
                  <div className="b-info">
                    <div className="b-name">{b.event || 'Booking'}</div>
                    <div className="b-meta">{b.kode_booking} · {formatTanggal(b.tanggal_acara)}</div>
                  </div>
                  <span className={`status-pill ${b.status_pembayaran === 'Lunas' ? 'lunas' : 'belum'}`}>
                    {b.status_pembayaran}
                  </span>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setSelectedClient(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onChanged={loadData}
        />
      )}
    </div>
  )
}
