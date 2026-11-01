import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Plane, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi } from '../../hooks/useApi'
import { flightService } from '../../services/flight.service'
import { formatWeight, formatDateTime } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

// NOTOC is only printable for departure flights (origin=NKC)
// that haven't departed yet — status must be 'scheduled' or 'boarding'
const NOTOC_ALLOWED_STATUSES = ['scheduled', 'boarding']

function NotocButton({ flight }) {
  const [loading, setLoading] = useState(false)

  const canPrint  = NOTOC_ALLOWED_STATUSES.includes(flight.status)
  const awbList   = flight.awbs || []
  const hasCargo  = awbList.length > 0

  const tooltip = !canPrint
    ? flight.status === 'departed' || flight.status === 'arrived'
      ? 'Flight already departed — NOTOC was issued before departure'
      : flight.status === 'cancelled'
        ? 'Flight cancelled'
        : 'NOTOC not available for this flight status'
    : !hasCargo
      ? 'No AWBs manifested on this flight yet'
      : 'Print NOTOC — Notification to Captain'

  const handleClick = async () => {
    setLoading(true)
    try {
      const blob = await flightService.downloadNOTOC(flight.id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `NOTOC_${flight.flight_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  const active = canPrint && hasCargo

  return (
    <button
      onClick={active ? handleClick : undefined}
      disabled={loading || !active}
      title={tooltip}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
        ${active
          ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50 hover:bg-purple-800/50 cursor-pointer'
          : 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed opacity-50'
        }`}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : <FileText size={13} />
      }
      {!canPrint && (flight.status === 'departed' || flight.status === 'arrived')
        ? 'NOTOC Issued'
        : 'Print NOTOC'
      }
    </button>
  )
}

export default function FlightList() {
  const { can } = useAuth()
  const [filter, setFilter] = useState('all')

  const { data, loading, error, refetch } = useApi(
    () => flightService.list()
  )
  const flights  = data?.data || data || []
  const deps     = flights.filter(f => f.origin === 'NKC')
  const arrs     = flights.filter(f => f.destination === 'NKC')
  const filtered = flights.filter(f =>
    filter === 'all'        ? true
    : filter === 'dep'      ? f.origin === 'NKC'
    : filter === 'arr'      ? f.destination === 'NKC'
    : f.status === filter
  )

  if (error) return <ApiError error={error} onRetry={refetch} />
  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Flight Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {flights.length} total · <span className="text-emerald-400 font-medium">{deps.length} departures</span> · <span className="text-blue-400 font-medium">{arrs.length} arrivals</span>
          </p>
        </div>
        {can('manage_flights') && <Link to="/flights/new" className="btn-primary"><Plus size={16}/> New Flight</Link>}
      </div>

      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'dep', label: '↑ Departures' },
          { key: 'arr', label: '↓ Arrivals' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'boarding',  label: 'Boarding' },
          { key: 'departed',  label: 'Departed' },
          { key: 'arrived',   label: 'Arrived' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === key ? 'bg-slate-700 text-slate-100 shadow'
                : key === 'dep' ? 'text-emerald-500/70 hover:text-emerald-400'
                : key === 'arr' ? 'text-blue-500/70 hover:text-blue-400'
                : 'text-slate-500 hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(flight => {
          const loaded     = flight.loaded_kg   ?? 0
          const capacity   = flight.capacity_kg ?? 1
          const pct        = Math.round(loaded / capacity * 100)
          const flightNum  = flight.flight_number
          const awbList    = flight.awbs || []
          const hasDGR     = awbList.some(a => a.is_dgr)
          const overloaded = pct >= 100
          const isDeparture = flight.origin === 'NKC'     // NKC → X = departure
          const isArrival   = flight.destination === 'NKC' // X → NKC = arrival

          return (
            <div key={flight.id} className={`card p-5 border transition-colors
              ${overloaded ? 'border-red-700/50 bg-red-900/10'
              : isDeparture ? 'border-emerald-800/40' : 'border-blue-800/30'}`}>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="min-w-[120px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Plane size={16} className={isDeparture ? 'text-emerald-400' : 'text-blue-400'} />
                    <Link to={`/flights/${flight.id}`} className="font-mono font-bold text-xl text-slate-100 hover:text-blue-400 transition-colors">
                      {flightNum}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDeparture
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                        : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                    }`}>
                      {isDeparture ? '✈ DEP' : '✈ ARR'}
                    </span>
                    <span className="text-xs text-slate-600">{flight.aircraft_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="text-center">
                    <p className="font-mono font-bold text-2xl text-slate-100">{flight.origin}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(flight.departure_at || flight.departure)}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full max-w-[120px]">
                      <div className="h-px bg-slate-600 w-full" />
                      <Plane size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-mono font-bold text-2xl text-slate-100">{flight.destination}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(flight.arrival_at || flight.arrival)}</p>
                  </div>
                </div>

                <div className="min-w-[180px]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Cargo Load</span>
                    <span className={`font-bold ${overloaded ? 'text-red-400' : pct>=80 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${overloaded ? 'bg-red-500' : pct>=80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct,100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{formatWeight(loaded)}</span><span>{formatWeight(capacity)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge status={flight.status} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{awbList.length} AWBs</span>
                    {hasDGR && <span className="badge bg-orange-900/50 text-orange-300 border border-orange-700/50 text-[10px]">DGR</span>}
                    {overloaded && <span className="badge bg-red-900/50 text-red-300 border border-red-700/50 text-[10px]"><AlertTriangle size={10}/> OVERLOAD</span>}
                  </div>
                  {/* NOTOC only on departure flights */}
                  {isDeparture && <NotocButton flight={flight} />}
                </div>
              </div>

              {awbList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500 mr-1">Manifested AWBs:</span>
                  {awbList.map(a => (
                    <Link key={a.id} to={`/awb/${a.id}`}
                      className="font-mono text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-800/50">
                      {a.awb_number || a.awbNumber}
                      {(a.is_dgr || a.isDGR) && <span className="ml-1 text-orange-400">☢</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <Plane size={40} className="mx-auto mb-2 opacity-30" />
            <p>No flights with status "{filter}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
