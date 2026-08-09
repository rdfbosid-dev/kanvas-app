import { useEffect, useRef, useState } from 'react'
import './CustomSelect.css'

export default function CustomSelect({ options, value, onChange, placeholder = 'Pilih' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="cselect" ref={ref}>
      <button
        type="button"
        className={`cselect-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{value || placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="cselect-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={`cselect-option${opt === value ? ' sel' : ''}`}
              onClick={() => { onChange(opt); setOpen(false) }}
            >
              {opt}
              {opt === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
