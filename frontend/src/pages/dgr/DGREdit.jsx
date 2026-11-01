import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi } from '../../hooks/useApi'
import { dgrService } from '../../services/dgr.service'
import { DGR_CLASSES, PACKING_GROUPS } from '../../lib/utils'

export default function DGREdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const { data: dgr, loading, error: loadError, refetch } = useApi(() => dgrService.get(id), [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = new FormData(e.target)
    const payload = {
      dgr_class:            form.get('dgr_class'),
      un_number:            form.get('un_number'),
      proper_shipping_name: form.get('proper_shipping_name'),
      packing_group:        form.get('packing_group') || null,
      erg_code:             form.get('erg_code'),
      net_quantity:         form.get('net_quantity'),
      number_of_packages:   Number(form.get('number_of_packages')),
      packaging_type:       form.get('packaging_type') || null,
      emergency_contact:    form.get('emergency_contact'),
      remarks:              form.get('remarks') || null,
    }
    try {
      await dgrService.update(id, payload)
      navigate('/dgr')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update DGR declaration.')
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (loadError) return <ApiError error={loadError} onRetry={refetch} />

  if (dgr?.status !== 'pending') {
    return (
      <div className="max-w-3xl space-y-4 animate-fade-in">
        <Link to="/dgr" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} /> Back to DGR list
        </Link>
        <Alert variant="warning" title="Cannot Edit">
          Only pending declarations can be edited. This DGR is currently <strong>{dgr?.status}</strong>.
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/dgr" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Edit DGR Declaration</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">{dgr?.un_number}</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Alert variant="warning" title="IATA DGR Compliance Required">
        All dangerous goods must comply with IATA DGR 65th Edition. Incorrect declarations may result in shipment rejection.
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
            DGR Classification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Hazard Class *" name="dgr_class" required defaultValue={dgr?.dgr_class || ''}>
              <option value="">Select IATA class…</option>
              {DGR_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select label="Packing Group" name="packing_group" defaultValue={dgr?.packing_group || ''}>
              <option value="">Not applicable</option>
              {PACKING_GROUPS.map(g => <option key={g} value={g}>Packing Group {g}</option>)}
            </Select>
            <Input label="UN Number *"  name="un_number"  required defaultValue={dgr?.un_number} />
            <Input label="ERG Code *"   name="erg_code"   required defaultValue={dgr?.erg_code} />
            <div className="md:col-span-2">
              <Input label="Proper Shipping Name (IATA) *" name="proper_shipping_name" required defaultValue={dgr?.proper_shipping_name} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
            Quantity & Packaging
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Net Quantity *"       name="net_quantity"       required defaultValue={dgr?.net_quantity} />
            <Input label="Number of Packages *" name="number_of_packages" type="number" min="1" required defaultValue={dgr?.number_of_packages} />
            <div className="md:col-span-2">
              <Input label="Packaging Type & UN Certification" name="packaging_type" defaultValue={dgr?.packaging_type || ''} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
            Emergency Contact & Remarks
          </h2>
          <div className="space-y-4">
            <Input label="Emergency Contact *" name="emergency_contact" type="tel" required defaultValue={dgr?.emergency_contact} />
            <Textarea label="Remarks / Special Instructions" name="remarks" defaultValue={dgr?.remarks || ''} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/dgr" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-warning px-6">
            {saving ? 'Saving…' : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  )
}
