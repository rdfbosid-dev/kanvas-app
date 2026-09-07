import { useLayoutEffect, useRef, useState } from 'react'
import './TrendChart.css'

const W = 600
const H = 200
const PAD_TOP = 16

function buildPoints(values, sharedMax) {
  const max = sharedMax || Math.max(...values, 1)
  const n = values.length
  return values.map((v, i) => {
    const x = n > 1 ? (i / (n - 1)) * W : W / 2
    const y = H - (v / max) * (H - PAD_TOP)
    return [x, y]
  })
}
function toPolyline(pts) {
  return pts.map(([x, y]) => `${x},${y}`).join(' ')
}
function toAreaPath(pts) {
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  return `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
}
function pathLen(pts) {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1]
    const [x2, y2] = pts[i]
    len += Math.hypot(x2 - x1, y2 - y1)
  }
  return len
}

// series: [{ label, values: number[], color, format?: (v)=>string }]
// area: kalau true, series[0] dirender sebagai area terisi (bukan cuma garis)
export default function TrendChart({ series, months, area = false, mounted }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const [tooltipLeft, setTooltipLeft] = useState(0)
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)

  const sharedMax = Math.max(...series.flatMap((s) => s.values), 1)
  const seriesPts = series.map((s) => buildPoints(s.values, sharedMax))
  const n = months.length

  function handleMove(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const idx = Math.round(relX * (n - 1))
    setHoverIdx(Math.max(0, Math.min(n - 1, idx)))
  }

  const hoverX = hoverIdx !== null ? (n > 1 ? (hoverIdx / (n - 1)) * W : W / 2) : null

  // Dulu posisi tooltip cuma dibedain 3 kondisi (titik pertama/tengah/
  // terakhir) pakai translateX persen tetap -- itu nggak cukup, soalnya
  // titik yang "deket" pinggir (misal bulan Nov, ke-11 dari 12) masih bisa
  // nyerempet keluar card kalau card-nya sempit (di HP) atau isi tooltip-nya
  // kepanjangan (banyak baris data). Sekarang diukur BENERAN: lebar
  // tooltip asli (px) vs lebar card asli (px), abis itu posisinya
  // "diclamp" (dipentok) biar nggak pernah nongol dari sisi manapun,
  // dijalanin ulang tiap kali hover pindah titik. useLayoutEffect (bukan
  // useEffect biasa) dipakai biar pengukuran & koreksi posisinya kelar
  // SEBELUM browser sempet ngegambar (nggak keliatan "loncat" sekilas).
  useLayoutEffect(() => {
    if (hoverIdx === null || !svgRef.current || !tooltipRef.current) return
    const containerWidth = svgRef.current.getBoundingClientRect().width
    const tooltipWidth = tooltipRef.current.offsetWidth
    const anchorPx = (hoverX / W) * containerWidth
    const margin = 4
    let left = anchorPx - tooltipWidth / 2
    left = Math.max(margin, Math.min(left, containerWidth - tooltipWidth - margin))
    setTooltipLeft(left)
  }, [hoverIdx, hoverX])

  return (
    <div className="trendchart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="trendchart-svg"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {area && (
          <defs>
            <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="70%" stopColor={series[0].color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={series[0].color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
        )}

        {area && (
          <path
            d={toAreaPath(seriesPts[0])}
            fill="url(#trendAreaFill)"
            stroke="none"
            className="trendchart-area"
            style={{ opacity: mounted ? 1 : 0 }}
          />
        )}

        {series.map((s, si) => {
          const pts = seriesPts[si]
          const len = pathLen(pts)
          return (
            <polyline
              key={s.label}
              points={toPolyline(pts)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="trendchart-line"
              style={{
                strokeDasharray: len,
                strokeDashoffset: mounted ? 0 : len,
              }}
            />
          )
        })}

        {hoverX !== null && (
          <line x1={hoverX} y1="0" x2={hoverX} y2={H} className="trendchart-crosshair" />
        )}
      </svg>

      {/* Titik data SENGAJA dirender di luar <svg>, sebagai <div> HTML biasa
          yang ditumpuk pakai posisi persen (bukan <circle> SVG). Soalnya
          <svg> di atas pakai preserveAspectRatio="none" biar garis/area-nya
          bisa stretch selebar card -- tapi itu bikin <circle> ikut ke-stretch
          nggak proporsional juga (jadi lonjong/gepeng). <div> HTML biasa
          ukurannya didefinisiin lewat CSS pixel (bukan ikut sistem koordinat
          SVG yang di-stretch), jadi PASTI bulat sempurna berapapun rasio
          box-nya. Posisi kiri/atasnya dihitung persen dari x/W & y/H --
          matematikanya sama persis kayak yang dipakai svg buat nge-plot
          titik itu sendiri, jadi tetep presisi nempel di garis. */}
      <div className="trendchart-dots">
        {series.map((s, si) =>
          seriesPts[si].map(([x, y], i) => (
            <div
              key={s.label + i}
              className="trendchart-dot"
              style={{
                left: `${(x / W) * 100}%`,
                top: `${(y / H) * 100}%`,
                width: hoverIdx === i ? 10 : 7,
                height: hoverIdx === i ? 10 : 7,
                background: s.color,
                opacity: mounted ? 1 : 0,
                transitionDelay: mounted ? `${(i / n) * 0.9}s` : '0s',
              }}
            />
          ))
        )}
      </div>

      {hoverIdx !== null && (
        <div
          ref={tooltipRef}
          className="trendchart-tooltip"
          style={{ left: `${tooltipLeft}px` }}
        >
          <div className="tt-month">{months[hoverIdx]}</div>
          {series.map((s) => (
            <div className="tt-row" key={s.label}>
              <span className="tt-dot" style={{ background: s.color }}></span>
              <span>{s.label}</span>
              <b>{s.format ? s.format(s.values[hoverIdx]) : s.values[hoverIdx]}</b>
            </div>
          ))}
        </div>
      )}

      <div className="trend-axis">
        {months.map((m) => <span key={m}>{m}</span>)}
      </div>
      <div className="legend legend-row-inline">
        {series.map((s) => (
          <div className="legend-row" key={s.label}>
            <span className="legend-dot" style={{ background: s.color }}></span>{s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
