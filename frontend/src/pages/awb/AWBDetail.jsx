import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Download, Package, MapPin, User,
  Plane, AlertTriangle, CheckCircle, XCircle, Loader2,
  ChevronRight, RefreshCw, Lock, Unlock, CreditCard, DollarSign, Trash2,
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { Badge, DGRBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi, useMutation } from '../../hooks/useApi'
import { awbService } from '../../services/awb.service'
import { chargeService, PAYMENT_METHODS } from '../../services/charge.service'
import { formatWeight, formatDateTime, DGR_CLASSES } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

// ── Charges sub-component ────────────────────────────────────────────────────
function ChargesSection({ awbId, awbNumber, charge: initialCharge, isDGR }) {
  const [charge,     setCharge]    = useState(initialCharge || null)
  const [payModal,   setPayModal]  = useState(null)   // 'paid' | 'partial'
  const [payMethod,  setPayMethod] = useState('')
  const [payRef,     setPayRef]    = useState('')
  const [paying,     setPaying]    = useState(false)
  const { showToast } = useToast()

  const handlePay = async () => {
    if (!payMethod) return
    setPaying(true)
    try {
      const updated = await chargeService.markPaid(awbId, {
        status:            payModal,
        payment_method:    payMethod,
        payment_reference: payRef || null,
      })
      setCharge(updated)
      setPayModal(null); setPayMethod(''); setPayRef('')
      showToast(`Payment recorded via ${PAYMENT_METHODS.find(m=>m.value===payMethod)?.label || payMethod}.`)
    } catch {
      showToast('Failed to record payment.', 'error')
    } finally {
      setPaying(false)
    }
  }

  if (!charge) return null

  const statusColors = {
    pending:   'bg-amber-900/30 text-amber-300 border-amber-700/50',
    paid:      'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
    partial:   'bg-blue-900/30 text-blue-300 border-blue-700/50',
    cancelled: 'bg-slate-700 text-slate-400 border-slate-600',
  }

  const paidMethod = PAYMENT_METHODS.find(m => m.value === charge.payment_method)

  const rows = [
    { label: 'Freight Charge',  value: charge.freight_charge,  note: 'weight × 2.50 MRU/kg' },
    { label: 'Handling Fee',    value: charge.handling_fee,    note: 'Ground handling' },
    { label: 'Security Levy',   value: charge.security_levy,   note: 'Security screening' },
    { label: 'Fuel Surcharge',  value: charge.fuel_surcharge,  note: '20% of freight' },
    ...(isDGR ? [{ label: 'DGR Surcharge', value: charge.dgr_surcharge, note: 'Dangerous goods flat fee' }] : []),
    ...(+charge.other_charges > 0 ? [{ label: 'Other Charges', value: charge.other_charges, note: '' }] : []),
  ]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-green-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Charges & Billing</h3>
          <span className={`badge border text-[10px] ${statusColors[charge.status]}`}>
            {charge.status?.toUpperCase()}
          </span>
          {paidMethod && (
            <span className="text-xs text-slate-400">{paidMethod.icon} {paidMethod.label}</span>
          )}
        </div>
        <div className="flex gap-2">
          {charge.status !== 'paid' && (
            <button onClick={() => setPayModal('paid')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors">
              <DollarSign size={12} /> Mark Paid
            </button>
          )}
          {charge.status !== 'partial' && charge.status !== 'paid' && (
            <button onClick={() => setPayModal('partial')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white transition-colors">
              Partial Payment
            </button>
          )}
          <Link to={`/awb/${awbId}/invoice`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">
            Invoice ↗
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-2.5 text-slate-400">{row.label}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{row.note}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200 font-medium">
                  {Number(row.value).toFixed(2)} UM
                </td>
              </tr>
            ))}
            <tr className="bg-slate-800">
              <td className="px-4 py-3 font-bold text-slate-100" colSpan={2}>TOTAL DUE</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-lg text-green-400">
                {Number(charge.total).toFixed(2)} <span className="text-xs font-normal text-slate-500">MRU</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {charge.due_date && (
        <p className="text-xs text-slate-500 mt-3">
          Due date: <span className="text-slate-300">{charge.due_date}</span>
          {charge.paid_at && <span className="text-emerald-400 ml-3">Paid: {formatDateTime(charge.paid_at)}</span>}
          {charge.payment_reference && <span className="text-slate-500 ml-3">Ref: <span className="font-mono text-slate-300">{charge.payment_reference}</span></span>}
        </p>
      )}

      {/* Payment modal */}
      <Modal open={!!payModal} onClose={() => { setPayModal(null); setPayMethod(''); setPayRef('') }}
        title={payModal === 'paid' ? 'Record Full Payment' : 'Record Partial Payment'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Payment Method *</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button" onClick={() => setPayMethod(m.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                    payMethod === m.value
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}>
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{m.label}</p>
                    <p className="text-[10px] opacity-60">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Reference / Transaction ID <span className="text-slate-600">(optional)</span></label>
            <input value={payRef} onChange={e => setPayRef(e.target.value)}
              placeholder="e.g. BNK-2026-001234"
              className="input-field font-mono" />
          </div>
          <div className="bg-slate-900 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Amount</p>
            <p className="text-2xl font-bold font-mono text-green-400">{Number(charge.total).toFixed(2)} <span className="text-sm font-normal text-slate-500">MRU</span></p>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setPayModal(null); setPayMethod(''); setPayRef('') }} className="btn-secondary">Cancel</button>
            <button onClick={handlePay} disabled={!payMethod || paying}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
              {paying ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><DollarSign size={14} /> Confirm Payment</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────

const STATUS_FLOW  = ['received', 'processing', 'loaded', 'in_transit', 'delivered']
const STATUS_LABEL = {
  received:   'Received',
  processing: 'Processing',
  loaded:     'Loaded',
  in_transit: 'In Transit',
  delivered:  'Delivered',
  blocked:    'Blocked',
}

export default function AWBDetail() {
  const { id }         = useParams()
  const { can }        = useAuth()
  const navigate       = useNavigate()
  const { showToast }  = useToast()

  // UI state
  const [deleteModal,   setDeleteModal]   = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [downloading,   setDownloading]   = useState(false)
  const [blockModal,    setBlockModal]    = useState(false)
  const [unblockModal,  setUnblockModal]  = useState(false)
  const [advanceModal,  setAdvanceModal]  = useState(null)
  const [blockReason,   setBlockReason]   = useState('')
  const [saving,        setSaving]        = useState(false)

  const { data: awb, loading, error, refetch } = useApi(
    () => awbService.get(id),
    [id],
  )

  const updateStatus = async (status, reason = null) => {
    setSaving(true)
    try {
      await awbService.updateStatus(id, {
        status,
        ...(reason ? { block_reason: reason } : {}),
      })
      showToast(`Status updated to ${STATUS_LABEL[status]}`)
      refetch()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAdvance = async () => {
    await updateStatus(advanceModal)
    setAdvanceModal(null)
  }

  const handleBlock = async () => {
    if (!blockReason.trim()) return
    await updateStatus('blocked', blockReason.trim())
    setBlockModal(false)
    setBlockReason('')
  }

  const handleUnblock = async () => {
    const prev = STATUS_FLOW[Math.max(0, STATUS_FLOW.indexOf('in_transit'))]
    await updateStatus(prev)
    setUnblockModal(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await awbService.remove(id)
      navigate('/awb')
    } catch (err) {
      setDeleteModal(false)
      showToast(err.response?.data?.message || 'Failed to delete AWB.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const blob = await awbService.downloadPDF(id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `AWB_${awb.awb_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

// ── Loading / error ───────────────────────────────────────────────────────────
  if (loading) return <PageLoader />
  if (error)   return <ApiError error={error} onRetry={refetch} />

  const awbNumber   = awb.awb_number
  const isDGR       = awb.is_dgr
  const dgr         = awb.dgr    || null
  const flight      = awb.flight || null
  const creator     = awb.creator
  const sph         = awb.special_handling || []
  const dgrClass    = dgr ? DGR_CLASSES.find(c => c.value === dgr.dgr_class) : null
  const currentStep = STATUS_FLOW.indexOf(awb.status)
  const isBlocked   = awb.status === 'blocked'
  const isDelivered = awb.status === 'delivered'
  const nextStatus  = !isBlocked && !isDelivered ? STATUS_FLOW[currentStep + 1] : null

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link to="/awb" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono text-slate-100">{awbNumber}</h1>
            <Badge status={awb.status} />
            {isDGR && <DGRBadge dgrClass={dgr?.dgr_class || ''} />}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Created by {creator?.name} · {formatDateTime(awb.created_at)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {can('edit_awb') && (
            <Link to={`/awb/${id}/edit`} className="btn-secondary">
              <Edit2 size={14} /> Edit
            </Link>
          )}
          <Link to={`/awb/${id}/invoice`} className="btn-secondary">
            <DollarSign size={14} /> Invoice
          </Link>

          {/* Advance to next status — supervisor + admin only */}
          {can('process_shipment') && nextStatus && (
            <button
              onClick={() => setAdvanceModal(nextStatus)}
              className="btn-primary"
            >
              <ChevronRight size={15} />
              Mark as {STATUS_LABEL[nextStatus]}
            </button>
          )}

          {/* Block — admin only */}
          {can('block_shipment') && !isBlocked && !isDelivered && (
            <button onClick={() => setBlockModal(true)} className="btn-danger">
              <Lock size={14} /> Block
            </button>
          )}

          {/* Unblock — admin only */}
          {can('block_shipment') && isBlocked && (
            <button onClick={() => setUnblockModal(true)} className="btn-warning">
              <Unlock size={14} /> Unblock
            </button>
          )}

          <button onClick={handleDownloadPDF} disabled={downloading} className="btn-secondary">
            {downloading
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><Download size={15} /> Print AWB</>
            }
          </button>

          {can('delete_awb') && (
            <button
              onClick={() => setDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Status stepper ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Shipment Progress</p>
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <RefreshCw size={12} className="animate-spin" /> Updating…
            </span>
          )}
        </div>

        {isBlocked ? (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-700/50 rounded-xl p-4">
            <XCircle size={20} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 font-semibold text-sm">Shipment Blocked</p>
              <p className="text-red-400 text-xs mt-0.5">{awb.block_reason}</p>
            </div>
            {can('edit_awb') && (
              <button onClick={() => setUnblockModal(true)} className="btn-secondary text-xs py-1.5">
                <Unlock size={12} /> Unblock
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {STATUS_FLOW.map((s, i) => {
              const done    = i <= currentStep
              const active  = i === currentStep
              const isNext  = i === currentStep + 1
              const clickable = can('edit_awb') && isNext && !isDelivered

              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center gap-1.5 ${i < STATUS_FLOW.length - 1 ? 'flex-1' : ''}`}>
                    <button
                      disabled={!clickable || saving}
                      onClick={() => clickable && setAdvanceModal(s)}
                      title={clickable ? `Advance to ${STATUS_LABEL[s]}` : undefined}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                        ${active
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                          : done
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : clickable
                              ? 'bg-slate-800 border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 cursor-pointer animate-pulse-slow'
                              : 'bg-slate-800 border-slate-600 text-slate-600 cursor-default'
                        }`}
                    >
                      {done && !active ? <CheckCircle size={15} /> : i + 1}
                    </button>
                    <span className={`text-xs capitalize whitespace-nowrap font-medium
                      ${active   ? 'text-blue-400'
                      : done     ? 'text-emerald-400'
                      : clickable? 'text-slate-400'
                      :            'text-slate-600'}`}>
                      {s.replace('_', ' ')}
                    </span>
                    {clickable && (
                      <span className="text-[9px] text-blue-500 font-medium">click to advance</span>
                    )}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded transition-colors ${i < currentStep ? 'bg-emerald-600' : 'bg-slate-700'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Shipper / Consignee / Cargo / Flight ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><User size={16} className="text-blue-400" /><h3 className="font-semibold text-slate-100 text-sm">Shipper</h3></div>
          <div className="space-y-2">
            <div><p className="text-xs text-slate-500">Company</p><p className="text-slate-100 font-medium">{awb.shipper_name}</p></div>
            <div><p className="text-xs text-slate-500">Address</p><p className="text-slate-300 text-sm">{awb.shipper_address}</p></div>
            <div><p className="text-xs text-slate-500">Country</p><p className="text-slate-300 text-sm font-mono">{awb.shipper_country}</p></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><MapPin size={16} className="text-emerald-400" /><h3 className="font-semibold text-slate-100 text-sm">Consignee</h3></div>
          <div className="space-y-2">
            <div><p className="text-xs text-slate-500">Company</p><p className="text-slate-100 font-medium">{awb.consignee_name}</p></div>
            <div><p className="text-xs text-slate-500">Address</p><p className="text-slate-300 text-sm">{awb.consignee_address}</p></div>
            <div><p className="text-xs text-slate-500">Country</p><p className="text-slate-300 text-sm font-mono">{awb.consignee_country}</p></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><Package size={16} className="text-amber-400" /><h3 className="font-semibold text-slate-100 text-sm">Cargo Details</h3></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Route',     value: `${awb.origin} → ${awb.destination}`, mono: true },
              { label: 'Commodity', value: awb.commodity },
              { label: 'Pieces',    value: `${awb.pieces} pcs` },
              { label: 'Gross Wt', value: formatWeight(awb.weight_kg) },
              { label: 'Volume',   value: awb.volume_m3 ? `${awb.volume_m3} m³` : '—' },
              { label: 'Handling', value: sph.join(', ') || '—', mono: true },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-slate-200 text-sm font-medium ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><Plane size={16} className="text-cyan-400" /><h3 className="font-semibold text-slate-100 text-sm">Flight</h3></div>
          {flight ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-3">
                <div className="text-center">
                  <p className="font-mono font-bold text-xl text-slate-100">{flight.flight_number}</p>
                  <p className="text-xs text-slate-500">{flight.aircraft_type}</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{flight.origin}</span>
                    <Plane size={14} className="text-blue-400" />
                    <span className="font-mono font-bold text-slate-100">{flight.destination}</span>
                  </div>
                  <Badge status={flight.status} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-500">Departure</p><p className="text-slate-200 text-xs">{formatDateTime(flight.departure_at)}</p></div>
                <div><p className="text-xs text-slate-500">Arrival</p><p className="text-slate-200 text-xs">{formatDateTime(flight.arrival_at)}</p></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-600">
              <Plane size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No flight assigned</p>
            </div>
          )}
        </div>
      </div>

      {/* ── DGR ── */}
      {dgr && (
        <div className="card p-5 border-orange-700/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400" />
              <h3 className="font-semibold text-slate-100 text-sm">DGR Declaration</h3>
              <span className="badge bg-orange-900/50 text-orange-300 border border-orange-700/50 text-[10px]">Class {dgr.dgr_class}</span>
            </div>
            <Badge status={dgr.status} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'UN Number',     value: dgr.un_number,         mono: true },
              { label: 'Class',         value: dgrClass?.label?.split('—')[1]?.trim() || dgr.dgr_class },
              { label: 'Packing Group', value: dgr.packing_group || 'N/A', mono: true },
              { label: 'ERG Code',      value: dgr.erg_code,          mono: true },
              { label: 'Net Qty',       value: dgr.net_quantity },
              { label: 'Packages',      value: dgr.number_of_packages },
              { label: 'Packaging',     value: dgr.packaging_type },
              { label: 'Emergency',     value: dgr.emergency_contact, mono: true },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-slate-200 text-sm font-medium mt-0.5 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {dgr.notoc_generated && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle size={14} />
              <span>NOTOC: <span className="font-mono">{dgr.notoc_ref}</span></span>
              <Link to={`/dgr/${dgr.id}/notoc`} className="ml-auto text-xs text-blue-400 hover:text-blue-300">View NOTOC →</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Charges ── */}
      <ChargesSection awbId={id} awbNumber={awbNumber} charge={awb.charge} isDGR={isDGR} />

      {/* ── Advance status confirmation modal ── */}
      <Modal
        open={!!advanceModal}
        onClose={() => setAdvanceModal(null)}
        title="Advance Shipment Status"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-4">
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-1">Current</p>
              <Badge status={awb.status} />
            </div>
            <ChevronRight size={20} className="text-blue-400 shrink-0" />
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-1">New status</p>
              <Badge status={advanceModal} />
            </div>
          </div>

          <p className="text-sm text-slate-400">
            Confirm advancing <span className="font-mono text-slate-200 font-semibold">{awbNumber}</span> to{' '}
            <span className="font-semibold text-slate-100">{STATUS_LABEL[advanceModal]}</span>?
          </p>

          {advanceModal === 'delivered' && (
            <Alert variant="success" title="Final Status">
              Delivered is the final status. This action cannot be undone without admin access.
            </Alert>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => setAdvanceModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdvance} disabled={saving} className="btn-primary">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle size={14} /> Confirm</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Block modal ── */}
      <Modal open={blockModal} onClose={() => { setBlockModal(false); setBlockReason('') }} title="Block Shipment" size="sm">
        <div className="space-y-4">
          <Alert variant="error" title="Block Shipment">
            The shipment will be halted and all parties notified. Provide a clear reason.
          </Alert>
          <div>
            <label className="label">Reason for Blocking *</label>
            <textarea
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="e.g. Missing health certificate — awaiting Ministry validation"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setBlockModal(false); setBlockReason('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleBlock} disabled={!blockReason.trim() || saving} className="btn-danger">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Lock size={14} /> Block Shipment</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete modal ── */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete AWB" size="sm">
        <div className="space-y-4">
          <Alert variant="error" title="This action is permanent">
            AWB <span className="font-mono font-bold">{awbNumber}</span> and all associated documents and charges will be permanently deleted.
          </Alert>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete AWB
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Unblock modal ── */}
      <Modal open={unblockModal} onClose={() => setUnblockModal(false)} title="Unblock Shipment" size="sm">
        <div className="space-y-4">
          <Alert variant="info" title="Unblock Shipment">
            The shipment will be set back to <strong>In Transit</strong> and processing can resume.
          </Alert>
          <div className="bg-slate-900 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Current block reason</p>
            <p className="text-sm text-red-300">{awb.block_reason}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setUnblockModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleUnblock} disabled={saving} className="btn-warning">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Unlock size={14} /> Unblock</>}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
