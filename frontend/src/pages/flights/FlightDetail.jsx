import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plane, AlertTriangle, FileText, Plus,
  X, Loader2, CheckCircle, Search, Trash2,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Modal } from '../../components/ui/Modal'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi } from '../../hooks/useApi'
import { flightService } from '../../services/flight.service'
import { awbService } from '../../services/awb.service'
import { formatWeight, formatDateTime } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const AWB_PREFIXES = {
  TK: ['235'],
  AT: ['147'],
  AH: ['124'],
  TU: ['199'],
  L6: ['495'],
  HC: ['490'],
  NT: ['474'],
  WT: ['574', '221'],
  KP: ['032'],
}

const AIRLINE_NAMES = {
  TK: 'Turkish Airlines',
  AT: 'Royal Air Maroc',
  AH: 'Air Algerie',
  TU: 'Tunis Air',
  L6: 'Mauritania Airlines',
  HC: 'Air Senegal',
  NT: 'Binter Canarias',
  WT: 'Swift Air',
  KP: 'ASKY Airline',
}

function getIATA(flightNumber) {
  return Object.keys(AWB_PREFIXES).find(iata =>
    flightNumber?.toUpperCase().startsWith(iata)
  ) || null
}

export default function FlightDetail() {
  const { id }     = useParams()
  const { can }    = useAuth()
  const navigate   = useNavigate()

  const [deleteModal,    setDeleteModal]    = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const [assignModal,    setAssignModal]    = useState(false)
  const [search,         setSearch]         = useState('')
  const [availableAWBs,  setAvailableAWBs]  = useState([])
  const [awbLoading,     setAwbLoading]     = useState(false)
  const [assigning,      setAssigning]      = useState(null)
  const [removing,       setRemoving]       = useState(null)
  const [overloadWarn,   setOverloadWarn]   = useState(null)
  const [downloading,    setDownloading]    = useState(false)
  const [toast,          setToast]          = useState(null)

  const { data: flight, loading, error, refetch } = useApi(
    () => flightService.get(id),
    [id],
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await flightService.remove(id)
      navigate('/flights')
    } catch (err) {
      setDeleteModal(false)
      showToast(err.response?.data?.message || 'Failed to delete flight.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch unassigned AWBs matching the airline's prefix(es) when modal is open
  useEffect(() => {
    if (!assignModal || !flight) return
    const prefixes = AWB_PREFIXES[getIATA(flight.flight_number)] || []
    const timer = setTimeout(async () => {
      setAwbLoading(true)
      try {
        const data = await awbService.list({ search })
        const all  = data?.data || data || []
        setAvailableAWBs(
          all.filter(a =>
            prefixes.some(p => a.awb_number?.startsWith(p + '-')) && !a.flight_id
          )
        )
      } catch { /* silent */ } finally {
        setAwbLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, assignModal, flight])

  if (loading) return <PageLoader />
  if (error)   return <ApiError error={error} onRetry={refetch} />

  const flightNumber = flight.flight_number
  const iata         = getIATA(flightNumber)
  const prefixes     = AWB_PREFIXES[iata] || []
  const airlineName  = AIRLINE_NAMES[iata] || iata || 'Unknown Airline'

  const awbs       = flight.awbs || []
  const loaded     = +(flight.loaded_kg ?? awbs.reduce((s, a) => s + +a.weight_kg, 0))
  const capacity   = +(flight.capacity_kg ?? 1)
  const pct        = Math.round((loaded / capacity) * 100)
  const overloaded = pct >= 100
  const isDep      = flight.origin === 'NKC'
  const canAssign  = can('edit_awb') &&
    !['departed', 'arrived', 'cancelled'].includes(flight.status)

  const openAssignModal = () => {
    setSearch(prefixes[0] ? prefixes[0] + '-' : '')
    setOverloadWarn(null)
    setAssignModal(true)
  }

  const handleAssign = async (awb) => {
    setAssigning(awb.id)
    try {
      const res = await flightService.assignAWB(id, awb.id)
      if (res.warning) setOverloadWarn(res.warning)
      showToast(`${awb.awb_number} added to ${flightNumber}`)
      refetch()
      // Remove the just-assigned AWB from the local list
      setAvailableAWBs(prev => prev.filter(a => a.id !== awb.id))
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign AWB', 'error')
    } finally {
      setAssigning(null)
    }
  }

  const handleRemove = async (awb) => {
    setRemoving(awb.id)
    try {
      await flightService.removeAWB(id, awb.id)
      showToast(`${awb.awb_number} removed from flight`)
      refetch()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove AWB', 'error')
    } finally {
      setRemoving(null)
    }
  }

  const handleDownloadNOTOC = async () => {
    setDownloading(true)
    try {
      const blob = await flightService.downloadNOTOC(id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `NOTOC_${flightNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Failed to generate NOTOC', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">

      {toast && (
        <Alert variant={toast.type === 'error' ? 'error' : 'success'} onClose={() => setToast(null)}>
          {toast.msg}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/flights" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono text-slate-100">{flightNumber}</h1>
            <Badge status={flight.status} />
            {overloaded && (
              <span className="badge bg-red-900/50 text-red-300 border border-red-700/50 text-[10px]">
                <AlertTriangle size={10} className="inline mr-0.5" />OVERLOAD
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {airlineName} · {flight.aircraft_type}
          </p>
        </div>
        {isDep && awbs.length > 0 && ['scheduled', 'boarding'].includes(flight.status) && (
          <button
            onClick={handleDownloadNOTOC}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-700/50 hover:bg-purple-800/50 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            Print NOTOC
          </button>
        )}
        {can('manage_flights') && (
          <button
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>

      {/* Route */}
      <div className="card p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="font-mono font-bold text-3xl text-slate-100">{flight.origin}</p>
            <p className="text-xs text-slate-500 mt-1">{formatDateTime(flight.departure_at)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Departure (UTC)</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-[140px]">
              <div className="h-px bg-slate-600 w-full" />
              <Plane size={18} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDep ? 'text-emerald-400' : 'text-blue-400'}`} />
            </div>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-3xl text-slate-100">{flight.destination}</p>
            <p className="text-xs text-slate-500 mt-1">{formatDateTime(flight.arrival_at)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Arrival (UTC)</p>
          </div>
          <div className="border-l border-slate-700 pl-6 ml-2 space-y-2">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Aircraft</p>
              <p className="text-sm font-semibold text-slate-200">{flight.aircraft_type}</p>
            </div>
            {flight.uld_positions != null && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">ULD Positions</p>
                <p className="text-sm font-semibold text-slate-200">{flight.uld_positions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load gauge */}
      <div className="card p-5">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-slate-400 font-medium">Cargo Load</span>
          <span className={`font-bold text-lg ${overloaded ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {pct}%
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all ${overloaded ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatWeight(loaded)} loaded</span>
          <span>{formatWeight(capacity)} capacity</span>
        </div>
        {overloaded && (
          <Alert variant="error" className="mt-3">
            Overloaded by {formatWeight(loaded - capacity)}. Remove AWBs or request capacity increase.
          </Alert>
        )}
      </div>

      {/* AWB Manifest */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-100 text-sm">AWB Manifest</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {awbs.length} AWB{awbs.length !== 1 ? 's' : ''} · AWB prefix{prefixes.length > 1 ? 'es' : ''}{' '}
              <span className="font-mono text-slate-400">{prefixes.join(', ')}</span>
              {' '}({airlineName})
            </p>
          </div>
          {canAssign && (
            <button onClick={openAssignModal} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
              <Plus size={13} /> Assign AWB
            </button>
          )}
        </div>

        {awbs.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Plane size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No AWBs on this flight yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {awbs.map(awb => (
              <div
                key={awb.id}
                className="flex items-center gap-4 bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <Link
                  to={`/awb/${awb.id}`}
                  className="font-mono font-semibold text-blue-400 hover:text-blue-300 text-sm min-w-[140px]"
                >
                  {awb.awb_number}
                </Link>
                {awb.is_dgr && (
                  <span className="text-[10px] font-bold bg-orange-900/50 text-orange-300 border border-orange-700/50 rounded px-1.5 py-0.5 shrink-0">
                    ☢ DGR
                  </span>
                )}
                <span className="flex-1 text-sm text-slate-400 truncate">{awb.commodity || '—'}</span>
                <span className="text-xs font-mono text-slate-400 shrink-0">{formatWeight(awb.weight_kg)}</span>
                <Badge status={awb.status} />
                {canAssign && (
                  <button
                    onClick={() => handleRemove(awb)}
                    disabled={removing === awb.id}
                    title="Remove from flight"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-500 hover:text-red-400 hover:bg-red-900/20 border border-transparent hover:border-red-800/40 transition-colors shrink-0"
                  >
                    {removing === awb.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <X size={11} />
                    }
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Flight Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Flight" size="sm">
        <div className="space-y-4">
          <Alert variant="error" title="This action is permanent">
            Flight <span className="font-mono font-bold">{flightNumber}</span> and all its manifest data will be deleted.
            {awbs.length > 0 && (
              <p className="mt-1">Remove the {awbs.length} assigned AWB{awbs.length > 1 ? 's' : ''} first before deleting.</p>
            )}
          </Alert>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Flight
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign AWB Modal */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title={`Assign AWB to ${flightNumber}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs bg-slate-900 rounded-lg px-3 py-2 text-slate-400">
            <span>Showing only</span>
            <span className="font-mono font-bold text-blue-300">{prefixes.join(', ')}</span>
            <span>prefixes ({airlineName}) — unassigned only</span>
          </div>

          {overloadWarn && <Alert variant="warning">{overloadWarn}</Alert>}

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search by AWB number, shipper, commodity…`}
              className="input-field pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {awbLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : availableAWBs.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                <p className="text-sm">No unassigned {prefixes.join('/')} AWBs found.</p>
              </div>
            ) : (
              availableAWBs.map(awb => (
                <div
                  key={awb.id}
                  className="flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-100 text-sm">{awb.awb_number}</span>
                      {awb.is_dgr && (
                        <span className="text-[10px] font-bold bg-orange-900/50 text-orange-300 border border-orange-700/50 rounded px-1.5 py-0.5">
                          ☢ DGR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {awb.commodity} · {awb.origin}→{awb.destination} · {formatWeight(awb.weight_kg)}
                      {awb.shipper_name && ` · ${awb.shipper_name}`}
                    </p>
                  </div>
                  <Badge status={awb.status} />
                  <button
                    onClick={() => handleAssign(awb)}
                    disabled={!!assigning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-primary shrink-0"
                  >
                    {assigning === awb.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCircle size={12} />
                    }
                    Assign
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end border-t border-slate-800 pt-3">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
