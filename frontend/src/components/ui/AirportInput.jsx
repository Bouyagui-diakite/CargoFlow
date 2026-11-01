import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, AlertCircle, Plane } from 'lucide-react'
import { AIRPORTS } from '../../data/airports'
import { cn } from '../../lib/utils'

export function lookupAirport(code) {
  if (!code) return null
  return AIRPORTS[code.toUpperCase()] || null
}

// Build up to `limit` suggestions for a query, ranking exact/prefix code matches first.
function searchAirports(query, limit = 8) {
  const q = query.trim().toUpperCase()
  if (!q) return []
  const codeMatches = []
  const textMatches = []
  for (const code in AIRPORTS) {
    if (code.startsWith(q)) {
      codeMatches.push(code)
    } else if (q.length >= 2) {
      const a = AIRPORTS[code]
      if (a.city.toUpperCase().includes(q) || a.name.toUpperCase().includes(q)) {
        textMatches.push(code)
      }
    }
    if (codeMatches.length >= limit) break
  }
  return [...codeMatches, ...textMatches].slice(0, limit)
}

/**
 * Free-text IATA airport field with live validation and typeahead.
 * Renders a hidden input carrying `name` so it works with native FormData submits.
 * The submitted value is always the uppercased 3-letter code.
 */
export function AirportInput({ label, name, defaultValue = '', required = false, placeholder = 'e.g. NKC' }) {
  const [value, setValue] = useState((defaultValue || '').toUpperCase())
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const airport = AIRPORTS[value] || null
  const valid = !!airport
  const showError = value.length > 0 && !valid
  const suggestions = useMemo(() => (open ? searchAirports(value) : []), [value, open])

  // Block native form submit when the code is missing/invalid.
  useEffect(() => {
    if (!inputRef.current) return
    if (required && !value) inputRef.current.setCustomValidity('Please enter an airport code.')
    else if (showError) inputRef.current.setCustomValidity('This airport does not exist.')
    else inputRef.current.setCustomValidity('')
  }, [value, showError, required])

  // Close dropdown on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const select = (code) => {
    setValue(code)
    setOpen(false)
    inputRef.current?.focus()
  }

  const onChange = (e) => {
    setValue(e.target.value.toUpperCase().slice(0, 30))
    setOpen(true)
    setHighlight(0)
  }

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); select(suggestions[highlight]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className="space-y-1" ref={wrapRef}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          required={required}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className={cn(
            'input-field font-mono uppercase tracking-wide pr-9',
            valid && 'border-emerald-600 focus:ring-emerald-500',
            showError && 'border-red-500 focus:ring-red-500',
          )}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {valid && <Check size={16} className="text-emerald-400" />}
          {showError && <AlertCircle size={16} className="text-red-400" />}
        </span>

        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            {suggestions.map((code, i) => {
              const a = AIRPORTS[code]
              return (
                <li key={code}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(code) }}
                    onMouseEnter={() => setHighlight(i)}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors',
                      i === highlight ? 'bg-blue-600/20' : 'hover:bg-slate-800',
                    )}
                  >
                    <Plane size={13} className="text-slate-500 shrink-0" />
                    <span className="font-mono font-bold text-blue-400 w-10 shrink-0">{code}</span>
                    <span className="text-sm text-slate-200 truncate">{a.city}</span>
                    <span className="text-xs text-slate-500 truncate ml-auto pl-2">{a.country}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {valid && (
        <p className="text-xs text-emerald-400/90 truncate">
          {airport.name} · {airport.country}
        </p>
      )}
      {showError && (
        <p className="text-xs text-red-400">This airport doesn’t exist — enter a valid IATA code.</p>
      )}
    </div>
  )
}
