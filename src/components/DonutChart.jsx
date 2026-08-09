import { useEffect, useRef, useState } from 'react'
import './DonutChart.css'

const R = 54
const CIRC = 2 * Math.PI * R

export default function DonutChart({ data, colors, centerValue, centerLabel }) {
  const [mounted, setMounted] = useState(false)
  const [hoverIdx, setHoverIdx] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    // trigger sesudah render pertama, biar transisi CSS-nya kepicu
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const total = data.reduce((s, [, v]) => s + v, 0) || 1
  let cumulative = 0
  const segments = data.map(([label, value], i) => {
    const pct = value / total
    const startPct = cumulative
    cumulative += pct
    return { label, value, pct, startPct, color: colors[i % colors.length] }
  })

  const SEQ_DURATION = 1.0 // detik, total durasi sapuan semua segmen

  return (
    <div className="donutchart-wrap" ref={ref}>
      <svg viewBox="0 0 140 140" className="donutchart-svg">
        <circle cx="70" cy="70" r={R} className="donutchart-track" />
        {segments.map((seg, i) => {
          const visibleLen = mounted ? seg.pct * CIRC : 0
          const gap = CIRC - visibleLen
          const offset = -seg.startPct * CIRC
          const delay = seg.startPct * SEQ_DURATION
          const isHover = hoverIdx === i
          const isDim = hoverIdx !== null && !isHover
          return (
            <circle
              key={seg.label}
              cx="70" cy="70" r={R}
              className={`donutchart-seg${isDim ? ' dim' : ''}${isHover ? ' hover' : ''}`}
              stroke={seg.color}
              strokeDasharray={`${visibleLen} ${gap}`}
              strokeDashoffset={offset}
              style={{ transitionDelay: `${delay}s` }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          )
        })}
      </svg>
      <div className="donutchart-center">
        <div className="dc-val">{hoverIdx !== null ? Math.round(segments[hoverIdx].pct * 100) + '%' : centerValue}</div>
        <div className="dc-lab">{hoverIdx !== null ? segments[hoverIdx].label.slice(0, 10).toUpperCase() : centerLabel}</div>
      </div>
    </div>
  )
}
