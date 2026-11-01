import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Search, Filter, Printer, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/ui/Table'
import { SkeletonRow } from '../../components/ui/Loading'
import { awbService } from '../../services/awb.service'
import { PAYMENT_METHODS } from '../../services/charge.service'
import { formatDateTime } from '../../lib/utils'

const PAY_STATUS_COLORS = {
  paid:      'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
  partial:   'bg-blue-900/50 text-blue-300 border-blue-700/40',
  pending:   'bg-amber-900/50 text-amber-300 border-amber-700/40',
  cancelled: 'bg-slate-700 text-slate-400 border-slate-600',
}

const METHOD_COLORS = {
  bankily:       'bg-orange-900/40 text-orange-300 border-orange-700/40',
  masrivi:       'bg-blue-900/40 text-blue-300 border-blue-700/40',
  sedad:         'bg-purple-900/40 text-purple-300 border-purple-700/40',
  bank_transfer: 'bg-slate-700 text-slate-300 border-slate-600',
  cash:          'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  check:         'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
}

export default function PaymentList() {
  const [awbs,          setAwbs]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [methodFilter,  setMethodFilter]  = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    awbService.list({})
      .then(res => setAwbs(res.data || res))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const withCharge = awbs.filter(a => a.charge)

  const filtered = withCharge.filter(a => {
    const charge = a.charge
    const matchStatus = statusFilter === 'all' || charge.status === statusFilter
    const matchMethod = methodFilter === 'all' || charge.payment_method === methodFilter
    const matchSearch = !search ||
      a.awb_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.shipper_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.consignee_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchMethod && matchSearch
  })

  const totalRevenue = withCharge
    .filter(a => a.charge.status === 'paid')
    .reduce((s, a) => s + Number(a.charge.total || 0), 0)

  const pending  = withCharge.filter(a => a.charge.status === 'pending').length
  const paid     = withCharge.filter(a => a.charge.status === 'paid').length
  const partial  = withCharge.filter(a => a.charge.status === 'partial').length

  const methodBreakdown = PAYMENT_METHODS.map(m => ({
    ...m,
    count:  withCharge.filter(a => a.charge.payment_method === m.value).length,
    amount: withCharge
      .filter(a => a.charge.payment_method === m.value && a.charge.status === 'paid')
      .reduce((s, a) => s + Number(a.charge.total || 0), 0),
  })).filter(m => m.count > 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-900/50 border border-green-700/50 flex items-center justify-center">
            <CreditCard size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Payments</h1>
            <p className="text-sm text-slate-500 mt-0.5">All shipment charges & billing</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  value: `${totalRevenue.toLocaleString(undefined,{minimumFractionDigits:2})} MRU`, icon: TrendingUp,    color: 'text-green-400',   bg: 'bg-green-900/20' },
          { label: 'Paid',           value: paid,     icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
          { label: 'Partial',        value: partial,  icon: AlertCircle, color: 'text-blue-400',    bg: 'bg-blue-900/20'    },
          { label: 'Pending',        value: pending,  icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-900/20'   },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className={`card p-4 border-slate-700 ${kpi.bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <Icon size={20} className="text-slate-600" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment method breakdown */}
      {methodBreakdown.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Method Breakdown</p>
          <div className="flex flex-wrap gap-3">
            {methodBreakdown.map(m => (
              <button
                key={m.value}
                onClick={() => setMethodFilter(methodFilter === m.value ? 'all' : m.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                  methodFilter === m.value ? 'ring-2 ring-blue-500 ' : ''
                }${METHOD_COLORS[m.value] || 'bg-slate-700 text-slate-300 border-slate-600'}`}
              >
                <span className="text-base">{m.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight">{m.label}</p>
                  <p className="text-[10px] opacity-70">{m.count} txn · {m.amount.toLocaleString(undefined,{minimumFractionDigits:2})} MRU</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search AWB, shipper, consignee…" className="input-field pl-9 py-2" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-900/50">
              <Th>AWB</Th><Th>Route</Th><Th>Shipper → Consignee</Th><Th>Total</Th>
              <Th>Status</Th><Th>Method</Th><Th>Reference</Th><Th>Paid On</Th><Th>Invoice</Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
              : filtered.map(awb => {
                  const charge = awb.charge
                  const method = PAYMENT_METHODS.find(m => m.value === charge.payment_method)
                  return (
                    <Tr key={awb.id}>
                      <Td>
                        <Link to={`/awb/${awb.id}`} className="font-mono text-blue-400 hover:text-blue-300 text-xs font-semibold">
                          {awb.awb_number}
                        </Link>
                      </Td>
                      <Td><span className="font-mono text-sm text-slate-300">{awb.origin} → {awb.destination}</span></Td>
                      <Td>
                        <p className="text-slate-200 text-xs font-medium truncate max-w-[180px]">{awb.shipper_name}</p>
                        <p className="text-slate-500 text-xs truncate max-w-[180px]">{awb.consignee_name}</p>
                      </Td>
                      <Td>
                        <span className="font-mono font-bold text-green-400 text-sm">
                          {Number(charge.total).toFixed(2)}
                        </span>
                        <span className="text-slate-600 text-xs ml-1">MRU</span>
                      </Td>
                      <Td>
                        <span className={`badge border text-[10px] ${PAY_STATUS_COLORS[charge.status] || ''}`}>
                          {charge.status?.toUpperCase()}
                        </span>
                      </Td>
                      <Td>
                        {method
                          ? <span className={`badge border text-[10px] ${METHOD_COLORS[method.value] || ''}`}>{method.icon} {method.label}</span>
                          : <span className="text-slate-600 text-xs">—</span>
                        }
                      </Td>
                      <Td>
                        <span className="text-slate-400 text-xs font-mono">{charge.payment_reference || '—'}</span>
                      </Td>
                      <Td>
                        <span className="text-slate-400 text-xs">{charge.paid_at ? formatDateTime(charge.paid_at) : '—'}</span>
                      </Td>
                      <Td>
                        <Link to={`/awb/${awb.id}/invoice`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors"
                          title="Print Invoice">
                          <Printer size={14} />
                        </Link>
                      </Td>
                    </Tr>
                  )
                })
            }
          </tbody>
        </Table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <CreditCard size={36} className="mx-auto mb-2 opacity-30" />
            <p>No payments match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
