import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Shield, CheckCircle, XCircle, Clock, Eye, Download, Loader2, Edit2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Table, Th, Td, Tr } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { PageLoader, SkeletonRow, ApiError } from '../../components/ui/Loading'
import { useApi, useMutation } from '../../hooks/useApi'
import { dgrService } from '../../services/dgr.service'
import { DGR_CLASSES } from '../../lib/utils'

function NotocDownload({ dgrId, notocRef }) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      const blob = await dgrService.downloadNOTOC(dgrId)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `NOTOC_${notocRef}.pdf`
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
      title="Download NOTOC PDF"
      className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
    </button>
  )
}
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function DGRList() {
  const { can } = useAuth()
  const { showToast } = useToast()
  const [filter,        setFilter]  = useState('all')
  const [approveTarget, setApprove] = useState(null)
  const [rejectTarget,  setReject]  = useState(null)
  const [rejectReason,  setReason]  = useState('')

  const { data, loading, error, refetch } = useApi(
    () => dgrService.list()
  )
  const dgrs = data?.data || data || []

  const approveMut = useMutation((id) => dgrService.approve(id))
  const rejectMut  = useMutation(({ id, reason }) => dgrService.reject(id, reason))

  const filtered = dgrs.filter(d => filter === 'all' || d.status === filter)

  const handleApprove = async () => {
    const { ok } = await approveMut.mutate(approveTarget.id)
    setApprove(null)
    if (ok) { showToast(`DGR ${approveTarget.un_number || approveTarget.unNumber} approved — NOTOC generated`); refetch() }
    else showToast(approveMut.error, 'error')
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    const { ok } = await rejectMut.mutate({ id: rejectTarget.id, reason: rejectReason })
    setReject(null); setReason('')
    if (ok) { showToast(`DGR ${rejectTarget.un_number || rejectTarget.unNumber} rejected`, 'error'); refetch() }
  }

  if (error) return <ApiError error={error} onRetry={refetch} />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dangerous Goods (DGR)</h1>
          <p className="text-sm text-slate-500 mt-0.5">IATA declarations & NOTOC management</p>
        </div>
        {can('create_dgr') && (
          <Link to="/dgr/new" className="btn-warning"><Plus size={16} /> New Declaration</Link>
        )}
      </div>


      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: dgrs.length,                                  icon: Shield,       bg: 'bg-slate-700/30' },
          { label: 'Pending',  value: dgrs.filter(d => d.status==='pending').length,  icon: Clock,        bg: 'bg-amber-900/20' },
          { label: 'Approved', value: dgrs.filter(d => d.status==='approved').length, icon: CheckCircle, bg: 'bg-emerald-900/20' },
          { label: 'Rejected', value: dgrs.filter(d => d.status==='rejected').length, icon: XCircle,     bg: 'bg-red-900/20' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`card p-4 ${card.bg} border-slate-700`}>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-slate-500">{card.label}</p><p className="text-2xl font-bold text-slate-100 mt-1">{card.value}</p></div>
                <Icon size={22} className="text-slate-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700">
        {['all','pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter===s ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-500 hover:text-slate-300'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table>
          <thead><tr className="bg-slate-900/50">
            <Th>AWB</Th><Th>UN Number</Th><Th>Class</Th><Th>Proper Shipping Name</Th>
            <Th>PG</Th><Th>Net Qty</Th><Th>NOTOC</Th><Th>Status</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {loading
              ? Array.from({length:4}).map((_,i) => <SkeletonRow key={i} cols={9} />)
              : filtered.map(dgr => {
                  const cls     = DGR_CLASSES.find(c => c.value === (dgr.dgr_class || dgr.dgrClass))
                  const awbNum  = dgr.awb?.awb_number || dgr.awbNumber
                  const awbId   = dgr.awb_id || dgr.awbId
                  const un      = dgr.un_number || dgr.unNumber
                  const pg      = dgr.packing_group || dgr.packingGroup
                  const nq      = dgr.net_quantity || dgr.netQuantity
                  const notocOk = dgr.notoc_generated || dgr.notocGenerated
                  const notocRef = dgr.notoc_ref || dgr.notocRef
                  return (
                    <Tr key={dgr.id}>
                      <Td>{awbNum ? <Link to={`/awb/${awbId}`} className="font-mono text-blue-400 hover:text-blue-300 text-xs font-semibold">{awbNum}</Link> : <span className="text-slate-600">—</span>}</Td>
                      <Td><span className="font-mono font-bold text-sm text-orange-300">{un}</span></Td>
                      <Td><span className={`text-xs font-semibold ${cls?.color||'text-slate-400'}`}>Class {dgr.dgr_class||dgr.dgrClass}</span></Td>
                      <Td><p className="text-slate-200 text-sm max-w-[200px] truncate">{dgr.proper_shipping_name||dgr.properShippingName}</p></Td>
                      <Td><span className="font-mono text-slate-400 text-sm">{pg||'N/A'}</span></Td>
                      <Td><span className="text-slate-300 text-sm">{nq}</span></Td>
                      <Td>
                        {notocOk
                          ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"><CheckCircle size={12}/>{notocRef}</span>
                          : <span className="text-xs text-slate-600">—</span>}
                      </Td>
                      <Td><Badge status={dgr.status} /></Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          {notocOk
                            ? <Link to={`/dgr/${dgr.id}/notoc`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors" title="View NOTOC"><Eye size={14}/></Link>
                            : <span className="p-1.5 text-slate-700 cursor-not-allowed" title="NOTOC not yet generated"><Eye size={14}/></span>
                          }
                          {notocOk && <NotocDownload dgrId={dgr.id} notocRef={notocRef} />}
                          {dgr.status === 'pending' && (
                            <Link to={`/dgr/${dgr.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-900/30 transition-colors" title="Edit"><Edit2 size={14}/></Link>
                          )}
                          {can('approve_dgr') && dgr.status === 'pending' && (
                            <>
                              <button onClick={() => setApprove(dgr)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-colors" title="Approve"><CheckCircle size={14}/></button>
                              <button onClick={() => setReject(dgr)}  className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors" title="Reject"><XCircle size={14}/></button>
                            </>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )
                })
            }
          </tbody>
        </Table>
        {!loading && filtered.length === 0 && <div className="text-center py-16 text-slate-600"><Shield size={36} className="mx-auto mb-2 opacity-30"/><p>No DGR declarations</p></div>}
      </div>

      {/* Approve modal */}
      <Modal open={!!approveTarget} onClose={() => setApprove(null)} title="Approve DGR Declaration" size="sm">
        <div className="space-y-4">
          <Alert variant="warning" title="Supervisor Approval">Confirm this shipment complies with IATA DGR regulations.</Alert>
          <div className="bg-slate-900 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">UN Number</span><span className="font-mono font-bold text-orange-300">{approveTarget?.un_number||approveTarget?.unNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Class</span><span>{approveTarget?.dgr_class||approveTarget?.dgrClass}</span></div>
          </div>
          <p className="text-xs text-slate-500">A NOTOC will be auto-generated and attached to the flight manifest.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setApprove(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleApprove} disabled={approveMut.loading} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
              {approveMut.loading ? 'Approving…' : <><CheckCircle size={14}/>Confirm</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={() => setReject(null)} title="Reject DGR Declaration" size="sm">
        <div className="space-y-4">
          <Alert variant="error" title="Reject Declaration">The cargo agent will be notified with the reason below.</Alert>
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea value={rejectReason} onChange={e => setReason(e.target.value)} rows={3} className="input-field resize-none" placeholder="Missing CNCAN authorization…" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setReject(null); setReason('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} disabled={!rejectReason.trim() || rejectMut.loading} className="btn-danger">
              {rejectMut.loading ? 'Rejecting…' : <><XCircle size={14}/>Reject</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
