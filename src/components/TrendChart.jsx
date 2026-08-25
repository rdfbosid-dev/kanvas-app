import { useRef, useState } from 'react'
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
  const svgRef = useRef(null)

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

        {series.map((s, si) =>
          seriesPts[si].map(([x, y], i) => (
            <circle
              key={s.label + i}
              cx={x} cy={y} r={hoverIdx === i ? 5 : 3.5}
              fill={s.color} stroke="#fff" strokeWidth="1"
              className="trendchart-dot"
              style={{ opacity: mounted ? 1 : 0, transitionDelay: mounted ? `${(i / n) * 0.9}s` : '0s' }}
            />
          ))
        )}

        {hoverX !== null && (
          <line x1={hoverX} y1="0" x2={hoverX} y2={H} className="trendchart-crosshair" />
        )}
      </svg>

      {hoverIdx !== null && (
        <div
          className="trendchart-tooltip"
          style={{ left: `${(hoverX / W) * 100}%` }}
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
