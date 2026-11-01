import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Package2 } from 'lucide-react'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi } from '../../hooks/useApi'
import { awbService } from '../../services/awb.service'
import { PAYMENT_METHODS } from '../../services/charge.service'
import { formatDate, formatDateTime, formatWeight } from '../../lib/utils'

const STATUS_LABELS = {
  pending:   'UNPAID',
  paid:      'PAID',
  partial:   'PARTIAL PAYMENT',
  cancelled: 'CANCELLED',
}
const STATUS_COLORS = {
  pending:   '#f59e0b',
  paid:      '#10b981',
  partial:   '#3b82f6',
  cancelled: '#64748b',
}

export default function AWBInvoice() {
  const { id } = useParams()
  const { data: awb, loading, error, refetch } = useApi(() => awbService.get(id), [id])
  const invoiceRef = useRef()

  const handlePrint = () => window.print()

  if (loading) return <PageLoader />
  if (error)   return <ApiError error={error} onRetry={refetch} />

  const charge  = awb.charge
  const method  = PAYMENT_METHODS.find(m => m.value === charge?.payment_method)
  const invoiceNum = `INV-${awb.awb_number}`
  const issueDate  = formatDate(awb.created_at)
  const dueDate    = charge?.due_date ? formatDate(charge.due_date) : '—'
  const rows = charge ? [
    { label: 'Freight Charge',  amount: charge.freight_charge,  note: `${awb.weight_kg} kg × 2.50 MRU/kg` },
    { label: 'Handling Fee',    amount: charge.handling_fee,    note: 'Ground handling' },
    { label: 'Security Levy',   amount: charge.security_levy,   note: 'Security screening' },
    { label: 'Fuel Surcharge',  amount: charge.fuel_surcharge,  note: '20% of freight' },
    ...(awb.is_dgr ? [{ label: 'DGR Surcharge', amount: charge.dgr_surcharge, note: 'Dangerous goods handling' }] : []),
    ...(+charge.other_charges > 0 ? [{ label: 'Other Charges', amount: charge.other_charges, note: '' }] : []),
  ] : []

  return (
    <>
      {/* Screen-only controls */}
      <div className="no-print flex items-center justify-between mb-6 animate-fade-in">
        <Link to={`/awb/${id}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} /> Back to AWB
        </Link>
        <button onClick={handlePrint} className="btn-primary">
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      {/* Invoice — visible both on screen and print */}
      <div ref={invoiceRef} className="invoice-sheet bg-white text-gray-900 max-w-3xl mx-auto rounded-xl shadow-2xl overflow-hidden no-print-shadow">

        {/* Header */}
        <div className="invoice-header flex items-start justify-between p-8 pb-6" style={{ background: '#0f172a' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#2563eb' }}>
              <Package2 size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <p className="font-bold text-xl" style={{ color: 'white' }}>CargoFlow</p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Air Freight Operator — NKC</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: 'white' }}>INVOICE</p>
            <p className="font-mono text-sm mt-1" style={{ color: '#60a5fa' }}>{invoiceNum}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between px-8 py-4" style={{ background: '#1e293b', color: '#94a3b8' }}>
          <div className="flex gap-8 text-sm">
            <div><p className="text-xs uppercase tracking-wide" style={{color:'#64748b'}}>Issue Date</p><p style={{color:'white'}}>{issueDate}</p></div>
            <div><p className="text-xs uppercase tracking-wide" style={{color:'#64748b'}}>Due Date</p><p style={{color:'white'}}>{dueDate}</p></div>
            <div><p className="text-xs uppercase tracking-wide" style={{color:'#64748b'}}>AWB Number</p><p className="font-mono" style={{color:'white'}}>{awb.awb_number}</p></div>
          </div>
          {charge && (
            <div className="text-center px-4 py-2 rounded-xl font-bold text-sm"
              style={{ background: STATUS_COLORS[charge.status] + '25', color: STATUS_COLORS[charge.status], border: `1px solid ${STATUS_COLORS[charge.status]}60` }}>
              {STATUS_LABELS[charge.status] || charge.status?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="p-8 space-y-8" style={{ background: 'white' }}>
          {/* Parties */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Bill To (Consignee)</p>
              <p className="font-bold text-gray-900">{awb.consignee_name}</p>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{awb.consignee_address}</p>
              <p className="text-sm font-mono font-semibold mt-1 text-gray-700">{awb.consignee_country}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Shipped By (Shipper)</p>
              <p className="font-bold text-gray-900">{awb.shipper_name}</p>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{awb.shipper_address}</p>
              <p className="text-sm font-mono font-semibold mt-1 text-gray-700">{awb.shipper_country}</p>
            </div>
          </div>

          {/* Shipment details */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
              Shipment Details
            </div>
            <div className="grid grid-cols-3 gap-0">
              {[
                { label: 'Route',      value: `${awb.origin} → ${awb.destination}`, mono: true },
                { label: 'Flight',     value: awb.flight?.flight_number || 'Not assigned' },
                { label: 'Commodity',  value: awb.commodity },
                { label: 'Pieces',     value: `${awb.pieces} pcs` },
                { label: 'Weight',     value: formatWeight(awb.weight_kg) },
                { label: 'Volume',     value: awb.volume_m3 ? `${awb.volume_m3} m³` : '—' },
              ].map((item, i) => (
                <div key={item.label} className="px-5 py-3" style={{ borderBottom: i < 3 ? '1px solid #e2e8f0' : undefined, borderRight: i % 3 !== 2 ? '1px solid #e2e8f0' : undefined }}>
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className={`text-sm font-semibold text-gray-900 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Charges */}
          {charge && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Charges Breakdown</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Description</th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Note</th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Amount (MRU)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.label} style={{ borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : undefined }}>
                        <td className="px-5 py-3 font-medium text-gray-800">{row.label}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{row.note}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-gray-900">{Number(row.amount).toFixed(2)} UM</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#0f172a' }}>
                      <td className="px-5 py-4 font-bold text-white" colSpan={2}>TOTAL DUE</td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-xl" style={{ color: '#4ade80' }}>
                        {Number(charge.total).toFixed(2)} <span className="text-sm font-normal" style={{ color: '#94a3b8' }}>MRU</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Payment info */}
          {charge && (
            <div className="flex items-start justify-between p-5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payment Information</p>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-bold text-sm mt-0.5" style={{ color: STATUS_COLORS[charge.status] }}>
                      {STATUS_LABELS[charge.status] || charge.status?.toUpperCase()}
                    </p>
                  </div>
                  {method && (
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="font-semibold text-sm mt-0.5 text-gray-800">{method.icon} {method.label}</p>
                    </div>
                  )}
                  {charge.payment_reference && (
                    <div>
                      <p className="text-xs text-gray-500">Reference</p>
                      <p className="font-mono text-sm mt-0.5 text-gray-800">{charge.payment_reference}</p>
                    </div>
                  )}
                  {charge.paid_at && (
                    <div>
                      <p className="text-xs text-gray-500">Paid On</p>
                      <p className="text-sm mt-0.5 text-gray-800">{formatDateTime(charge.paid_at)}</p>
                    </div>
                  )}
                </div>
              </div>
              {awb.is_dgr && (
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#fed7aa', color: '#92400e' }}>
                    ⚠ DGR Shipment
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="text-sm font-semibold text-gray-700">Thank you for choosing CargoFlow Air Freight</p>
            <p className="text-xs text-gray-500 mt-1">cargo@cargoflow.mr · Aéroport International de Nouakchott-Oumtounsy, Mauritanie</p>
            <p className="text-xs text-gray-400 mt-0.5">This document is computer-generated and does not require a signature.</p>
          </div>
        </div>
      </div>
    </>
  )
}
