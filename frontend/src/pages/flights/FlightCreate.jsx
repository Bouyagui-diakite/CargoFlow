import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plane, AlertTriangle, Plus } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { flightService } from '../../services/flight.service'

// ── Approved airlines & their allowed flight numbers ──────────────────────────
const AIRLINES = [
  {
    name: 'Turkish Airlines',   iata: 'TK',
    flights: [
      { number: 'TK571', dir: 'both',      route: 'IST ↔ NKC', aircraft: 'B737-800', capacity: 18000 },
      { number: 'TK583', dir: 'arrival',   route: 'IST → NKC', aircraft: 'B737-800', capacity: 18000 },
      { number: 'TK584', dir: 'departure', route: 'NKC → IST', aircraft: 'B737-800', capacity: 18000 },
      { number: 'TK585', dir: 'arrival',   route: 'IST → NKC', aircraft: 'B737-800', capacity: 18000 },
      { number: 'TK586', dir: 'departure', route: 'NKC → IST', aircraft: 'B737-800', capacity: 18000 },
      { number: 'TK597', dir: 'both',      route: 'IST ↔ NKC', aircraft: 'B737-800F', capacity: 22000 },
    ],
  },
  {
    name: 'Royal Air Maroc',    iata: 'AT',
    flights: [
      { number: 'AT510', dir: 'departure', route: 'NKC → CMN', aircraft: 'B737-800', capacity: 15000 },
      { number: 'AT511', dir: 'arrival',   route: 'CMN → NKC', aircraft: 'B737-800', capacity: 15000 },
      { number: 'AT520', dir: 'departure', route: 'NKC → CMN', aircraft: 'B737-800', capacity: 15000 },
      { number: 'AT521', dir: 'arrival',   route: 'CMN → NKC', aircraft: 'B737-800', capacity: 15000 },
    ],
  },
  {
    name: 'Air Algerie',        iata: 'AH',
    flights: [
      { number: 'AH4014', dir: 'arrival',   route: 'ALG → NKC', aircraft: 'B737-800', capacity: 14000 },
      { number: 'AH4015', dir: 'departure', route: 'NKC → ALG', aircraft: 'B737-800', capacity: 14000 },
    ],
  },
  {
    name: 'Tunis Air',          iata: 'TU',
    flights: [
      { number: 'TU563', dir: 'arrival',   route: 'TUN → NKC', aircraft: 'A320', capacity: 12000 },
      { number: 'TU564', dir: 'departure', route: 'NKC → TUN', aircraft: 'A320', capacity: 12000 },
    ],
  },
  {
    name: 'Binter Canarias',    iata: 'NT',
    flights: [
      { number: 'NT1804', dir: 'arrival',   route: 'LPA → NKC', aircraft: 'ATR72-600', capacity: 6500 },
      { number: 'NT1805', dir: 'departure', route: 'NKC → LPA', aircraft: 'ATR72-600', capacity: 6500 },
    ],
  },
  {
    name: 'Mauritania Airlines', iata: 'L6',
    extendable: true,   // can add custom L6 flight numbers
    flights: [
      { number: 'L6116', dir: 'departure', route: 'NKC → CDG', aircraft: 'B737-700', capacity: 14000 },
      { number: 'L6117', dir: 'arrival',   route: 'CDG → NKC', aircraft: 'B737-700', capacity: 14000 },
    ],
  },
  {
    name: 'Air Senegal',        iata: 'HC',
    flights: [
      { number: 'HC205', dir: 'arrival',   route: 'DSS → NKC', aircraft: 'A319', capacity: 10000 },
      { number: 'HC206', dir: 'departure', route: 'NKC → DSS', aircraft: 'A319', capacity: 10000 },
    ],
  },
  {
    name: 'Swift Air',          iata: 'WT',
    flights: [
      { number: 'WT192', dir: 'departure', route: 'NKC → LPA', aircraft: 'B737-400F', capacity: 20000 },
      { number: 'WT193', dir: 'arrival',   route: 'LPA → NKC', aircraft: 'B737-400F', capacity: 20000 },
    ],
  },
  {
    name: 'ASKY Airline',       iata: 'KP',
    flights: [
      { number: 'KP014', dir: 'arrival',   route: 'LFW → NKC', aircraft: 'B737-700', capacity: 13000 },
      { number: 'KP015', dir: 'departure', route: 'NKC → LFW', aircraft: 'B737-700', capacity: 13000 },
    ],
  },
]

// Parse route string into origin/destination
function parseRoute(route) {
  if (!route) return { origin: '', destination: '' }
  const parts = route.split(' → ')
  return { origin: parts[0] || '', destination: parts[1] || '' }
}

const DIR_LABELS = {
  departure: { label: '↑ DEP', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50' },
  arrival:   { label: '↓ ARR', color: 'bg-blue-900/50 text-blue-300 border-blue-700/50' },
  both:      { label: '↑↓ DEP + ARR', color: 'bg-purple-900/50 text-purple-300 border-purple-700/50' },
}

export default function FlightCreate() {
  const navigate  = useNavigate()
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  // Selections
  const [selectedAirline,  setAirline]  = useState(null)
  const [selectedFlight,   setFlight]   = useState(null)
  const [customL6Number,   setCustomL6] = useState('')
  const [direction,        setDirection] = useState('departure') // for L6 custom

  const airline = AIRLINES.find(a => a.name === selectedAirline)
  const flight  = airline?.flights.find(f => f.number === selectedFlight)

  // Auto-fill from selected flight
  const autoFill = useMemo(() => {
    if (!flight) return {}
    const { origin, destination } = parseRoute(flight.route)
    return {
      origin,
      destination,
      aircraft_type: flight.aircraft,
      capacity_kg:   flight.capacity,
    }
  }, [flight])

  // For L6 custom: determine origin/destination from direction
  const l6AutoFill = useMemo(() => {
    if (selectedAirline !== 'Mauritania Airlines' || !customL6Number) return {}
    return direction === 'departure'
      ? { origin: 'NKC', destination: 'CDG', aircraft_type: 'B737-700', capacity_kg: 14000 }
      : { origin: 'CDG', destination: 'NKC', aircraft_type: 'B737-700', capacity_kg: 14000 }
  }, [selectedAirline, customL6Number, direction])

  const effective = { ...autoFill, ...l6AutoFill }
  const isDep = effective.origin === 'NKC'
  const isArr = effective.destination === 'NKC'
  const flightDirection = isDep ? 'departure' : isArr ? 'arrival' : null

  const effectiveFlightNumber = airline?.iata === 'L6' && customL6Number
    ? `L6${customL6Number}`
    : selectedFlight || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!effectiveFlightNumber) return setError('Select or enter a flight number.')
    if (!effective.origin)      return setError('Origin is missing — select a flight number.')

    setSaving(true)
    setError(null)
    const form = new FormData(e.target)

    const payload = {
      flight_number:  effectiveFlightNumber.toUpperCase(),
      origin:         effective.origin,
      destination:    effective.destination,
      departure_at:   form.get('departure_at'),
      arrival_at:     form.get('arrival_at'),
      aircraft_type:  effective.aircraft_type || form.get('aircraft_type'),
      capacity_kg:    Number(form.get('capacity_kg') || effective.capacity_kg),
      volume_m3:      form.get('volume_m3')      ? Number(form.get('volume_m3'))      : null,
      uld_positions:  form.get('uld_positions')  ? Number(form.get('uld_positions'))  : null,
    }

    try {
      await flightService.create(payload)
      navigate('/flights')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create flight.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/flights" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Create New Flight</h1>
          <p className="text-sm text-slate-500 mt-0.5">Only approved airlines are allowed on this system</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Step 1: Select airline ── */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
            Select Airline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {AIRLINES.map(a => (
              <button
                key={a.name}
                type="button"
                onClick={() => { setAirline(a.name); setFlight(null); setCustomL6('') }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedAirline === a.name
                    ? 'bg-blue-900/40 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                }`}
              >
                <p className="text-xs font-bold text-slate-200">{a.iata}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{a.name}</p>
                {a.extendable && (
                  <p className="text-[9px] text-blue-400 mt-1">+ custom flights</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Step 2: Select flight number ── */}
        {airline && (
          <div className="card p-5 animate-fade-in">
            <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
              Select Flight Number
              <span className="text-xs text-slate-500 font-normal ml-1">— {airline.name}</span>
            </h2>

            <div className="space-y-2">
              {/* Standard flights */}
              {airline.flights.map(f => {
                const d = DIR_LABELS[f.dir]
                const isSelected = selectedFlight === f.number
                return (
                  <button
                    key={f.number}
                    type="button"
                    onClick={() => { setFlight(f.number); setCustomL6('') }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="font-mono font-bold text-slate-100 w-16">{f.number}</span>
                    <span className={`badge border text-[10px] ${d.color}`}>{d.label}</span>
                    <span className="text-sm text-slate-400 flex-1">{f.route}</span>
                    <span className="text-xs text-slate-600">{f.aircraft} · {(f.capacity/1000).toFixed(0)}t</span>
                  </button>
                )
              })}

              {/* Mauritania Airlines custom number */}
              {airline.extendable && (
                <div className="border border-dashed border-blue-700/50 rounded-xl p-4 bg-blue-900/10">
                  <p className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-1.5">
                    <Plus size={12} /> Add custom Mauritania Airlines flight
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Flight suffix (L6 + ___)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono font-bold text-sm">L6</span>
                        <input
                          value={customL6Number}
                          onChange={e => { setCustomL6(e.target.value.replace(/\D/g, '')); setFlight(null) }}
                          placeholder="118, 200…"
                          maxLength={6}
                          className="input-field flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Direction</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDirection('departure')}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            direction === 'departure'
                              ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                              : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          ↑ DEP
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirection('arrival')}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                            direction === 'arrival'
                              ? 'bg-blue-900/50 text-blue-300 border-blue-700/50'
                              : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          ↓ ARR
                        </button>
                      </div>
                    </div>
                  </div>
                  {customL6Number && (
                    <p className="text-xs text-slate-400 mt-2">
                      Will create: <span className="font-mono font-bold text-slate-200">L6{customL6Number}</span>
                      {' '}— {direction === 'departure' ? 'NKC → CDG (Departure)' : 'CDG → NKC (Arrival)'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Flight details (auto-filled) ── */}
        {(flight || (airline?.extendable && customL6Number)) && (
          <div className="card p-5 animate-fade-in">
            <h2 className="font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
              Flight Details
              {flightDirection && (
                <span className={`badge border text-[10px] ${DIR_LABELS[flightDirection]?.color}`}>
                  {DIR_LABELS[flightDirection]?.label}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Route and aircraft auto-filled from flight selection</p>

            {/* Route preview */}
            <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-4 mb-4">
              <div className="text-center">
                <p className="font-mono font-bold text-2xl text-slate-100">{effective.origin || '—'}</p>
                <p className="text-xs text-slate-500">Origin</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-[100px]">
                  <div className="h-px bg-slate-600 w-full" />
                  <Plane size={16} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDep ? 'text-emerald-400' : 'text-blue-400'}`} />
                </div>
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-2xl text-slate-100">{effective.destination || '—'}</p>
                <p className="text-xs text-slate-500">Destination</p>
              </div>
              <div className="border-l border-slate-700 pl-4 ml-2">
                <p className="text-xs text-slate-500">Aircraft</p>
                <p className="text-sm font-semibold text-slate-200">{effective.aircraft_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Departure Date/Time (UTC) *"
                name="departure_at"
                type="datetime-local"
                required
              />
              <Input
                label="Arrival Date/Time (UTC) *"
                name="arrival_at"
                type="datetime-local"
                required
              />
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div>
                <label className="label">Max Payload (kg) *</label>
                <input
                  name="capacity_kg"
                  type="number"
                  min="100"
                  defaultValue={effective.capacity_kg || ''}
                  className="input-field"
                  required
                />
              </div>
              <Input label="Volume (m³)" name="volume_m3" type="number" min="1" placeholder="e.g. 45" />
              <Input label="ULD Positions" name="uld_positions" type="number" min="0" placeholder="e.g. 8" />
            </div>

            {isDep && (
              <Alert variant="info" className="mt-4">
                <strong>Departure flight</strong> — NOTOC can be printed once AWBs are manifested (status: Scheduled or Boarding).
              </Alert>
            )}
            {isArr && (
              <Alert variant="info" className="mt-4">
                <strong>Arrival flight</strong> — NOTOC does not apply. AWBs manifested on this flight are inbound to NKC.
              </Alert>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link to="/flights" className="btn-secondary">Cancel</Link>
          <button
            type="submit"
            disabled={saving || (!selectedFlight && !customL6Number)}
            className="btn-primary px-6"
          >
            {saving ? 'Saving…' : <><Save size={15} /> Create Flight</>}
          </button>
        </div>
      </form>
    </div>
  )
}
