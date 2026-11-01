import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Printer, Eye, Edit2, Loader2, PlaneTakeoff, PlaneLanding, Layers } from 'lucide-react'
import { Badge, DGRBadge } from '../../components/ui/Badge'
import { Table, Th, Td, Tr } from '../../components/ui/Table'
import { SkeletonRow, ApiError } from '../../components/ui/Loading'
import { awbService } from '../../services/awb.service'
import { formatWeight, awbDirection, HUB_AIRPORT, cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const DIRECTION_TABS = [
  { key: 'all',        label: 'All AWBs',   Icon: Layers },
  { key: 'departures', label: 'Departures', Icon: PlaneTakeoff },
  { key: 'arrivals',   label: 'Arrivals',   Icon: PlaneLanding },
]

function DirectionBadge({ awb }) {
  const dir = awbDirection(awb)
  if (dir === 'departure') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">
        <PlaneTakeoff size={10} /> Departure
      </span>
    )
  }
  if (dir === 'arrival') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300">
        <PlaneLanding size={10} /> Arrival
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
      Transit
    </span>
  )
}

function PrintAWB({ awbId, awbNumber }) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      const blob = await awbService.downloadPDF(awbId)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `AWB_${awbNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Printer size={11} />}
      Print AWB
    </button>
  )
}


const STATUS_OPTS = ['all', 'received', 'processing', 'loaded', 'in_transit', 'delivered', 'blocked']

export default function AWBList() {
  const { can } = useAuth()
  const [awbs,         setAwbs]         = useState([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dgrOnly,      setDgrOnly]      = useState(false)
  const [direction,    setDirection]    = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = {}
    if (search)                 params.search = search
    if (statusFilter !== 'all') params.status = statusFilter
    if (dgrOnly)                params.is_dgr = 1
    if (direction === 'departures') params.origin = HUB_AIRPORT
    if (direction === 'arrivals')   params.destination = HUB_AIRPORT

    awbService.list(params)
      .then(res => {
        setAwbs(res.data || res)
        setTotal(res.total || res.length || 0)
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load AWBs'))
      .finally(() => setLoading(false))
  }, [search, statusFilter, dgrOnly, direction])

  useEffect(() => { load() }, [load])

  if (error) return <ApiError error={error} onRetry={load} />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Air Waybills</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} {direction === 'departures' ? 'departure' : direction === 'arrivals' ? 'arrival' : 'total'} AWB{total === 1 ? '' : 's'}
            {direction !== 'all' && <span className="text-slate-600"> · hub {HUB_AIRPORT}</span>}
          </p>
        </div>
        {can('create_awb') && (
          <Link to="/awb/new" className="btn-primary"><Plus size={16} /> New AWB</Link>
        )}
      </div>

      {/* Departures / Arrivals separation */}
      <div className="flex gap-1 border-b border-slate-800">
        {DIRECTION_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setDirection(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              direction === key
                ? 'border-blue-500 text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search AWB number, shipper, commodity…"
            className="input-field pl-9 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setDgrOnly(d => !d)}
            className={`w-9 h-5 rounded-full transition-colors relative ${dgrOnly ? 'bg-orange-600' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dgrOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-400">DGR only</span>
        </label>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-900/50">
              <Th>AWB Number</Th><Th>Route</Th><Th>Shipper</Th><Th>Consignee</Th>
              <Th>Pcs / Weight</Th><Th>Commodity</Th><Th>Status</Th><Th>Print</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
              : awbs.map(awb => {
                  const sph = awb.special_handling || []
                  return (
                    <Tr key={awb.id}>
                      <Td>
                        <Link to={`/awb/${awb.id}`} className="font-mono text-blue-400 hover:text-blue-300 text-xs font-semibold">
                          {awb.awb_number}
                        </Link>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {awb.is_dgr && <DGRBadge dgrClass="" />}
                          {sph.map(s => (
                            <span key={s} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">{s}</span>
                          ))}
                        </div>
                      </Td>
                      <Td>
                        <span className="font-mono text-sm">{awb.origin} → {awb.destination}</span>
                        <div className="mt-1"><DirectionBadge awb={awb} /></div>
                      </Td>
                      <Td>
                        <p className="text-slate-200 text-sm font-medium truncate max-w-[150px]">{awb.shipper_name}</p>
                        <p className="text-slate-500 text-xs">{awb.shipper_country}</p>
                      </Td>
                      <Td>
                        <p className="text-slate-200 text-sm font-medium truncate max-w-[150px]">{awb.consignee_name}</p>
                        <p className="text-slate-500 text-xs">{awb.consignee_country}</p>
                      </Td>
                      <Td>
                        <p className="text-slate-200 text-sm">{awb.pieces} pcs</p>
                        <p className="text-slate-500 text-xs">{formatWeight(awb.weight_kg)}</p>
                      </Td>
                      <Td><p className="text-slate-300 text-sm truncate max-w-[140px]">{awb.commodity}</p></Td>
                      <Td><Badge status={awb.status} /></Td>
                      {/* Print column */}
                      <Td>
                        <PrintAWB awbId={awb.id} awbNumber={awb.awb_number} />
                      </Td>
                      {/* Actions column */}
                      <Td>
                        <div className="flex items-center gap-1">
                          <Link to={`/awb/${awb.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors" title="View detail">
                            <Eye size={14} />
                          </Link>
                          {can('edit_awb') && (
                            <Link to={`/awb/${awb.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors" title="Edit">
                              <Edit2 size={14} />
                            </Link>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )
                })
            }
          </tbody>
        </Table>
        {!loading && awbs.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <p>No AWBs found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
