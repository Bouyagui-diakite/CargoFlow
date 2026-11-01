import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, Search, Filter, FileText, Printer, Loader2 } from 'lucide-react'
import { Badge, DGRBadge } from '../../components/ui/Badge'
import { Table, Th, Td, Tr } from '../../components/ui/Table'
import { SkeletonRow, ApiError } from '../../components/ui/Loading'
import { awbService } from '../../services/awb.service'
import { PAYMENT_METHODS } from '../../services/charge.service'
import { formatWeight } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const STATUS_OPTS = ['all', 'received', 'processing', 'loaded', 'in_transit', 'delivered', 'blocked']

const PAY_STATUS_COLORS = {
  paid:      'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  partial:   'bg-blue-900/50 text-blue-300 border-blue-700/40',
  pending:   'bg-amber-900/50 text-amber-300 border-amber-700/40',
  cancelled: 'bg-slate-700 text-slate-400 border-slate-600',
}

function PrintAWB({ awbId, awbNumber }) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      const blob = await awbService.downloadPDF(awbId)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `AWB_${awbNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } finally { setLoading(false) }
  }
  return (
    <button onClick={handleClick} disabled={loading}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap">
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Printer size={11} />} Print
    </button>
  )
}

export default function ImportList() {
  const { can } = useAuth()
  const [awbs,         setAwbs]         = useState([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true); setError(null)
    const params = { destination: 'NKC' }
    if (search)                params.search = search
    if (statusFilter !== 'all') params.status = statusFilter
    awbService.list(params)
      .then(res => { setAwbs(res.data || res); setTotal(res.total || res.length || 0) })
      .catch(err => setError(err.response?.data?.message || 'Failed to load imports'))
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  const pending  = awbs.filter(a => a.charge?.status === 'pending').length
  const paid     = awbs.filter(a => a.charge?.status === 'paid').length
  const totalRev = awbs.reduce((s, a) => s + (a.charge?.status === 'paid' ? Number(a.charge?.total || 0) : 0), 0)

  if (error) return (
    <div className="text-center py-20 text-slate-500">
      <p>{error}</p>
      <button onClick={load} className="btn-secondary mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900/50 border border-blue-700/50 flex items-center justify-center">
            <ArrowDownToLine size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Import Shipments</h1>
            <p className="text-sm text-slate-500 mt-0.5">Cargo arriving at NKC — {total} AWBs</p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total AWBs', value: total,    color: 'text-slate-100' },
          { label: 'Paid',       value: paid,      color: 'text-emerald-400' },
          { label: 'Unpaid',     value: pending,   color: 'text-amber-400' },
          { label: 'Revenue',    value: `${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })} MRU`, color: 'text-green-400' },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search AWB, shipper, commodity…" className="input-field pl-9 py-2" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-900/50">
              <Th>AWB Number</Th><Th>From</Th><Th>Shipper</Th><Th>Commodity</Th>
              <Th>Pcs / Weight</Th><Th>Status</Th><Th>Payment</Th><Th>Method</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
              : awbs.map(awb => {
                  const charge  = awb.charge
                  const method  = PAYMENT_METHODS.find(m => m.value === charge?.payment_method)
                  return (
                    <Tr key={awb.id}>
                      <Td>
                        <Link to={`/awb/${awb.id}`} className="font-mono text-blue-400 hover:text-blue-300 text-xs font-semibold">
                          {awb.awb_number}
                        </Link>
                        {awb.is_dgr && <DGRBadge dgrClass="" />}
                      </Td>
                      <Td><span className="font-mono text-sm">{awb.origin}</span></Td>
                      <Td>
                        <p className="text-slate-200 text-sm font-medium truncate max-w-[140px]">{awb.shipper_name}</p>
                        <p className="text-slate-500 text-xs">{awb.shipper_country}</p>
                      </Td>
                      <Td><p className="text-slate-300 text-sm truncate max-w-[130px]">{awb.commodity}</p></Td>
                      <Td>
                        <p className="text-slate-200 text-sm">{awb.pieces} pcs</p>
                        <p className="text-slate-500 text-xs">{formatWeight(awb.weight_kg)}</p>
                      </Td>
                      <Td><Badge status={awb.status} /></Td>
                      <Td>
                        {charge ? (
                          <span className={`badge border text-[10px] ${PAY_STATUS_COLORS[charge.status] || ''}`}>
                            {charge.status?.toUpperCase()}
                          </span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </Td>
                      <Td>
                        {method
                          ? <span className="text-xs text-slate-300">{method.icon} {method.label}</span>
                          : <span className="text-slate-600 text-xs">—</span>
                        }
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Link to={`/awb/${awb.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors" title="View">
                            <FileText size={14} />
                          </Link>
                          <Link to={`/awb/${awb.id}/invoice`} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors" title="Invoice">
                            <Printer size={14} />
                          </Link>
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
            <ArrowDownToLine size={36} className="mx-auto mb-2 opacity-30" />
            <p>No import AWBs found</p>
          </div>
        )}
      </div>
    </div>
  )
}
