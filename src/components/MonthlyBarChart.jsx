import { useState } from 'react'
import './MonthlyBarChart.css'

export default function MonthlyBarChart({ months, values, color, format, mounted }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const max = Math.max(...values, 1)

  return (
    <div className="mbar-wrap">
      <div className="mbar-bars">
        {values.map((v, i) => (
          <div
            key={i}
            className="mbar-col"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {hoverIdx === i && (
              <div className="mbar-tooltip">
                <div className="tt-month">{months[i]}</div>
                <div className="tt-val">{format ? format(v) : v}</div>
              </div>
            )}
            <div className="mbar-track">
              <div
                className={`mbar-bar${hoverIdx === i ? ' hover' : ''}`}
                style={{
                  height: mounted ? `${v > 0 ? Math.max((v / max) * 100, 4) : 0}%` : '0%',
                  background: color,
                  transitionDelay: `${i * 0.04}s`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mbar-axis">
        {months.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  )
}
