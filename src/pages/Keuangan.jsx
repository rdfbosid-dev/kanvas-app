import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import CustomSelect from '../components/CustomSelect'
import TrendChart from '../components/TrendChart'
import MonthlyBarChart from '../components/MonthlyBarChart'
import { useTheme } from '../context/ThemeContext'
import './Keuangan.css'

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_PENUH = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatRupiah(n) {
  return 'Rp' + (Number(n) || 0).toLocaleString('id-ID')
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const trendColorA = isDark ? '#6eb4ceff' : '#3d4a9a'
  const trendColorB = isDark ? '#F5C368' : '#E7A33D'

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterTahun, setFilterTahun] = useState(String(new Date().getFullYear()))
  const [chartsIn, setChartsIn] = useState(false)

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
                  months={BULAN_PENUH}
                  mounted={true}
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
                  <h3>Total Belanja Klien {filterTahun}</h3>
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

            <div className="table-card-finance table-head-card">
              <table className="keuangan-table keuangan-table-head">
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
                    <th className="right">Belanja Klien</th>
                    <th className="right">Transport</th>
                    <th className="right">Omzet</th>
                    <th className="right">Komisi Tim</th>
                    <th className="right">Penghasilan</th>
                    <th className="center">Tren</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="table-card-finance table-body-card">
              <table className="keuangan-table keuangan-table-body">
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
                <tbody>
                  {monthlyStats.map((m, i) => (
                    <tr key={m.label} className={m.booking === 0 ? 'row-empty' : ''}>
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
              </table>
            </div>
            <div className="table-card-finance table-foot-card">
              <table className="keuangan-table keuangan-table-foot">
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
