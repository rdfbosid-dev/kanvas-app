import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import CustomSelect from '../components/CustomSelect'
import TrendChart from '../components/TrendChart'
import MonthlyBarChart from '../components/MonthlyBarChart'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './Keuangan.css'

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_PENUH = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
}

// Nama studio dipakai buat awalan nama file export -- spasi dibuang total
// (misal "Dapur MUA" jadi "DapurMUA"), biar nama filenya bersih & valid.
function studioFilePrefix(name) {
  return (name || 'DapurMUA').replace(/\s+/g, '')
}

function TrendArrow({ curr, prev, isFirst }) {
  // Bulan pertama nggak punya pembanding -- default dianggap "naik"
  // (sesuai instruksi), kecuali datanya emang 0.
  let dir = 'flat'
  if (isFirst) dir = curr > 0 ? 'up' : 'flat'
  else if (curr > prev) dir = 'up'
  else if (curr < prev) dir = 'down'

  const paths = {
    up: <path d="M4 14l5-6 4 4 7-8M15 4h5v5" />,
    down: <path d="M4 6l5 6 4-4 7 8M15 20h5v-5" />,
    flat: <path d="M4 12h16" />,
  }
  const cls = { up: 'trend-up', down: 'trend-down', flat: 'trend-flat' }[dir]
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" className={`trend-arrow ${cls}`}>
      {paths[dir]}
    </svg>
  )
}

export default function Keuangan() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { profile } = useAuth()
  const isDark = theme === 'dark'
  const trendColorA = isDark ? '#6eb4ceff' : '#3d4a9a'
  const trendColorB = isDark ? '#F5C368' : '#E7A33D'

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()))
  const [chartsIn, setChartsIn] = useState(false)
  const [highlightBulan, setHighlightBulan] = useState(null)

  // Kalau halaman ini dibuka dari klik notif "Laporan Akhir Bulan" di
  // Dashboard, ada state { highlightBulan, highlightTahun } yang dikirim
  // lewat navigate(). Disimpen di ref (bukan langsung dipakai), soalnya
  // baru bisa dieksekusi SETELAH data booking-nya kelar dimuat.
  const pendingHighlightRef = useRef(
    location.state?.highlightBulan != null
      ? { bulan: location.state.highlightBulan, tahun: location.state.highlightTahun }
      : null
  )

  useEffect(() => {
    if (pendingHighlightRef.current) {
      setFilterTahun(String(pendingHighlightRef.current.tahun))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase.from('booking_summary').select('*')
      if (error) setError(error.message)
      else setBookings(data || [])
      setLoading(false)
      setChartsIn(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setChartsIn(true)))
    }
    load()
  }, [])

  useEffect(() => {
    setChartsIn(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setChartsIn(true)))
  }, [filterTahun])

  const tahunOptions = useMemo(() => {
    const years = new Set(bookings.map((b) => new Date(b.tanggal_acara).getFullYear()))
    years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a).map(String)
  }, [bookings])

  const monthlyStats = useMemo(() => {
    return BULAN_SINGKAT.map((label, i) => {
      const bulanBookings = bookings.filter((b) => {
        const d = new Date(b.tanggal_acara)
        return d.getMonth() === i && String(d.getFullYear()) === filterTahun
      })
      return {
        label,
        booking: bulanBookings.length,
        klien: bulanBookings.reduce((s, b) => s + (Number(b.total_klien) || 0), 0),
        belanja: bulanBookings.reduce((s, b) => s + (Number(b.belanja_klien) || 0), 0),
        transport: bulanBookings.reduce((s, b) => s + (Number(b.biaya_transport) || 0), 0),
        omzet: bulanBookings.reduce((s, b) => s + (Number(b.omzet) || 0), 0),
        komisi: bulanBookings.reduce((s, b) => s + ((Number(b.omzet) || 0) - (Number(b.penghasilan) || 0)), 0),
        penghasilan: bulanBookings.reduce((s, b) => s + (Number(b.penghasilan) || 0), 0),
      }
    })
  }, [bookings, filterTahun])

  // Begitu data kelar dimuat DAN tahunnya udah sesuai target dari notif,
  // baru scroll ke baris bulan yang dimaksud + nyalain highlight sebentar
  // (2.5 detik, terus fade balik normal). State router-nya dibersihin
  // abis dipakai, biar nggak ke-trigger ulang kalau halaman ini di-refresh.
  useEffect(() => {
    const pending = pendingHighlightRef.current
    if (!pending || loading) return
    if (String(pending.tahun) !== filterTahun) return

    const el = document.getElementById(`bulan-row-${pending.bulan}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightBulan(pending.bulan)
      setTimeout(() => setHighlightBulan(null), 2500)
    }
    pendingHighlightRef.current = null
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filterTahun])

  const totalTahun = monthlyStats.reduce((acc, m) => ({
    booking: acc.booking + m.booking,
    klien: acc.klien + m.klien,
    belanja: acc.belanja + m.belanja,
    transport: acc.transport + m.transport,
    omzet: acc.omzet + m.omzet,
    komisi: acc.komisi + m.komisi,
    penghasilan: acc.penghasilan + m.penghasilan,
  }), { booking: 0, klien: 0, belanja: 0, transport: 0, omzet: 0, komisi: 0, penghasilan: 0 })

  const adaData = monthlyStats.some((m) => m.booking > 0)

  // Export tabel keuangan (bulanan + total) ke file .xlsx -- pakai data
  // yang UDAH keitung (monthlyStats/totalTahun), nggak query ulang ke
  // Supabase, jadi isinya dijamin sama persis kayak yang keliatan di tabel.
  // SENGAJA async -- ExcelJS nge-generate file-nya lewat Promise
  // (writeBuffer), beda sama SheetJS yang sinkron.
  async function handleExportExcel() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(`Keuangan ${filterTahun}`)

    ws.columns = [
      { header: 'Bulan', key: 'bulan', width: 12 },
      { header: 'Booking', key: 'booking', width: 10 },
      { header: 'Klien', key: 'klien', width: 8 },
      { header: 'Pembayaran Klien', key: 'belanja', width: 15 },
      { header: 'Transport', key: 'transport', width: 13 },
      { header: 'Omzet', key: 'omzet', width: 15 },
      { header: 'Komisi Tim', key: 'komisi', width: 13 },
      { header: 'Penghasilan', key: 'penghasilan', width: 15 },
    ]

    // Style baris header -- bold, teks putih, background biru
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
      cell.alignment = { horizontal: 'center' }
    })

    monthlyStats.forEach((m, i) => {
      ws.addRow({
        bulan: BULAN_PENUH[i], booking: m.booking, klien: m.klien,
        belanja: m.belanja, transport: m.transport, omzet: m.omzet,
        komisi: m.komisi, penghasilan: m.penghasilan,
      })
    })

    // Baris Total -- bold, background abu-abu, biar beda dari baris bulanan
    const totalRow = ws.addRow({
      bulan: 'Total', booking: totalTahun.booking, klien: totalTahun.klien,
      belanja: totalTahun.belanja, transport: totalTahun.transport, omzet: totalTahun.omzet,
      komisi: totalTahun.komisi, penghasilan: totalTahun.penghasilan,
    })
    totalRow.eachCell((cell) => {
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    })

    // Kolom duit diformat jadi angka Rupiah (pemisah ribuan), buat SEMUA
    // baris (termasuk baris Total, soalnya numFmt di-set per kolom).
    ;['belanja', 'transport', 'omzet', 'komisi', 'penghasilan'].forEach((key) => {
      ws.getColumn(key).numFmt = '#,##0'
    })

    // ExcelJS nggak punya "writeFile" langsung buat browser (itu cuma
    // jalan di Node.js lewat fs) -- jadi file-nya di-generate sebagai
    // buffer dulu, dibungkus jadi Blob, baru download-nya dipicu manual
    // lewat trik <a download> yang di-klik via JS.
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${studioFilePrefix(profile?.studio_name)}_Rekap-Keuangan-${filterTahun}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="greeting">Keuangan</div>
            <div className="greeting-date">Rekap bulanan sepanjang tahun</div>
          </div>
          <div className="topbar-actions">
            <div className="filter-select"><CustomSelect options={tahunOptions} value={filterTahun} onChange={setFilterTahun} /></div>
            <button type="button" className="btn-booking-primary" onClick={handleExportExcel} disabled={!adaData}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
              Export Excel
            </button>
          </div>
        </div>

        {error && <div className="empty-state" style={{ color: 'var(--coral-tx)' }}>Gagal memuat data: {error}</div>}
        {loading && <div className="loading-state">Memuat data...</div>}

        {!loading && !error && (
          <>
            <div className="card-keuangan" style={{ marginBottom: 18 }}>
              <div className="card-head-keuangan"><h3>Tren Omzet &amp; Penghasilan {filterTahun}</h3></div>
              {!adaData ? (
                <div className="empty-state">Belum ada data di tahun ini.</div>
              ) : (
                <TrendChart
                  months={BULAN_SINGKAT}
                  mounted={chartsIn}
                  area
                  series={[
                    { label: 'Omzet', values: monthlyStats.map((m) => m.omzet), color: trendColorA, format: formatRupiah },
                    { label: 'Penghasilan', values: monthlyStats.map((m) => m.penghasilan), color: trendColorB, format: formatRupiah },
                  ]}
                />
              )}
            </div>

            <div className="bar-grid">
              <div className="card-keuangan">
                <div className="card-head-keuangan">
                  <h3>Total Pembayaran Klien {filterTahun}</h3>
                  <span className="chart-total-belanja">{formatRupiah(totalTahun.belanja)}</span>
                </div>
                <MonthlyBarChart
                  months={BULAN_SINGKAT}
                  values={monthlyStats.map((m) => m.belanja)}
                  color="var(--bar-belanja)"
                  format={formatRupiah}
                  mounted={chartsIn}
                />
              </div>

              <div className="card-keuangan">
                <div className="card-head-keuangan">
                  <h3>Total Biaya Transport {filterTahun}</h3>
                  <span className="chart-total-transport">{formatRupiah(totalTahun.transport)}</span>
                </div>
                <MonthlyBarChart
                  months={BULAN_SINGKAT}
                  values={monthlyStats.map((m) => m.transport)}
                  color="var(--bar-transport)"
                  format={formatRupiah}
                  mounted={chartsIn}
                />
              </div>

              <div className="card-keuangan">
                <div className="card-head-keuangan">
                  <h3>Total Komisi dari Tim {filterTahun}</h3>
                  <span className="chart-total-komisi">{formatRupiah(totalTahun.komisi)}</span>
                </div>
                <MonthlyBarChart
                  months={BULAN_SINGKAT}
                  values={monthlyStats.map((m) => m.komisi)}
                  color="var(--bar-komisi)"
                  format={formatRupiah}
                  mounted={chartsIn}
                />
              </div>
            </div>

            <div className="table-card-finance">
              <table className="keuangan-table">
                <colgroup>
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th className="right">Booking</th>
                    <th className="right">Klien</th>
                    <th className="right">Pembayaran Klien</th>
                    <th className="right">Transport</th>
                    <th className="right">Omzet</th>
                    <th className="right">Komisi Tim</th>
                    <th className="right">Penghasilan</th>
                    <th className="center">Tren</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((m, i) => (
                    <tr key={m.label} id={`bulan-row-${i}`} className={`${m.booking === 0 ? 'row-empty' : ''}${highlightBulan === i ? ' row-highlight' : ''}`}>
                      <td className="bulan-cell">{BULAN_PENUH[i]}</td>
                      <td className="right mono">{m.booking}</td>
                      <td className="right mono">{m.klien}</td>
                      <td className="right mono">{formatRupiah(m.belanja)}</td>
                      <td className="right mono">{formatRupiah(m.transport)}</td>
                      <td className="right mono">{formatRupiah(m.omzet)}</td>
                      <td className="right mono">{formatRupiah(m.komisi)}</td>
                      <td className="right mono strong">{formatRupiah(m.penghasilan)}</td>
                      <td className="center">
                        <TrendArrow curr={m.penghasilan} prev={monthlyStats[i - 1]?.penghasilan} isFirst={i === 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="bulan-cell">Total</td>
                    <td className="right mono">{totalTahun.booking}</td>
                    <td className="right mono">{totalTahun.klien}</td>
                    <td className="right mono">{formatRupiah(totalTahun.belanja)}</td>
                    <td className="right mono">{formatRupiah(totalTahun.transport)}</td>
                    <td className="right mono">{formatRupiah(totalTahun.omzet)}</td>
                    <td className="right mono">{formatRupiah(totalTahun.komisi)}</td>
                    <td className="right mono strong">{formatRupiah(totalTahun.penghasilan)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
