import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Printer, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi } from '../../hooks/useApi'
import { dgrService } from '../../services/dgr.service'
import { DGR_CLASSES, formatDateTime } from '../../lib/utils'

export default function NOTOCView() {
  const { id } = useParams()
  const [downloading, setDownloading] = useState(false)

  const { data: dgr, loading, error, refetch } = useApi(
    () => dgrService.getNOTOC(id),
    [id],
  )

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await dgrService.downloadNOTOC(id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `NOTOC_${dgr?.notoc_ref}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <PageLoader />
  if (error)   return <ApiError error={error} onRetry={refetch} />

  const flight     = dgr.awb?.flight
  const cls        = DGR_CLASSES.find(c => c.value === dgr.dgr_class)
  const notocRef   = dgr.notoc_ref
  const approvedAt = dgr.approved_at

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/dgr" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">NOTOC — {notocRef}</h1>
          <p className="text-sm text-slate-500">Notification to Captain — Generated {formatDateTime(approvedAt)}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Printer size={15} /> Print</button>
          <button onClick={handleDownload} disabled={downloading} className="btn-primary">
            {downloading
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><Download size={15} /> Download PDF</>
            }
          </button>
        </div>
      </div>

      {/* NOTOC Document */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold tracking-wider">NOTOC</p>
            <p className="text-sm text-slate-400">Notification To Captain</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Reference</p>
            <p className="font-mono font-bold text-lg">{notocRef}</p>
          </div>
        </div>

        <div className="p-8 space-y-6 font-sans text-sm">
          {/* Flight */}
          <div className="grid grid-cols-3 gap-6 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Flight Number</p>
              <p className="text-xl font-bold">{flight?.flight_number || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Route</p>
              <p className="text-xl font-bold font-mono">{flight?.origin || '—'} → {flight?.destination || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Departure</p>
              <p className="font-semibold">{formatDateTime(flight?.departure_at) || '—'}</p>
            </div>
          </div>

          {/* DGR Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-orange-600" />
              <h2 className="font-bold text-base uppercase tracking-wide">Dangerous Goods on Board</h2>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['AWB Number', 'UN Number', 'Proper Shipping Name', 'Class', 'PG', 'Net Qty', 'Pkgs', 'Location'].map(h => (
                    <th key={h} className="border border-slate-300 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-3 font-mono font-semibold">{dgr.awb?.awb_number || '—'}</td>
                  <td className="border border-slate-300 px-3 py-3 font-mono font-bold text-orange-700">{dgr.un_number}</td>
                  <td className="border border-slate-300 px-3 py-3">{dgr.proper_shipping_name}</td>
                  <td className="border border-slate-300 px-3 py-3 text-center font-bold">{dgr.dgr_class}</td>
                  <td className="border border-slate-300 px-3 py-3 text-center font-mono">{dgr.packing_group || '—'}</td>
                  <td className="border border-slate-300 px-3 py-3">{dgr.net_quantity}</td>
                  <td className="border border-slate-300 px-3 py-3 text-center">{dgr.number_of_packages}</td>
                  <td className="border border-slate-300 px-3 py-3 font-mono text-xs">BLK / ULD</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Packaging Type</p>
              <p className="font-medium">{dgr.packaging_type || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ERG Code</p>
              <p className="font-mono font-bold text-lg">{dgr.erg_code}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Emergency Contact</p>
              <p className="font-mono font-semibold">{dgr.emergency_contact}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks</p>
              <p>{dgr.remarks || '—'}</p>
            </div>
          </div>

          {/* Approval */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">Approved for Air Transport</p>
              <p className="text-xs text-emerald-700">
                Inspected and approved per IATA DGR regulations.
                Approved {formatDateTime(approvedAt)} by {dgr.approver?.name || 'authorized supervisor'}.
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Ground Operations Supervisor</p>
              <div className="border-b border-slate-400 w-48 mb-1" />
              <p className="text-xs text-slate-500">Signature / Date</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Captain Acknowledgement</p>
              <div className="border-b border-slate-400 w-48 mb-1" />
              <p className="text-xs text-slate-500">Signature / Date</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-2">
            Generated by CargoFlow Air Freight Management System — IATA DGR 65th Edition — {notocRef} — {formatDateTime(approvedAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
