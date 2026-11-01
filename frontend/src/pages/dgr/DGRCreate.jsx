import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'
import { useApi } from '../../hooks/useApi'
import { dgrService } from '../../services/dgr.service'
import { awbService } from '../../services/awb.service'
import { DGR_CLASSES, PACKING_GROUPS } from '../../lib/utils'

export default function DGRCreate() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const { data: awbData } = useApi(() => awbService.list({ is_dgr: 0 }))
  const awbs = awbData?.data || awbData || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = new FormData(e.target)
    const payload = {
      awb_id:               Number(form.get('awb_id')),
      dgr_class:            form.get('dgr_class'),
      un_number:            form.get('un_number'),
      proper_shipping_name: form.get('proper_shipping_name'),
      packing_group:        form.get('packing_group') || null,
      erg_code:             form.get('erg_code'),
      net_quantity:         form.get('net_quantity'),
      number_of_packages:   Number(form.get('number_of_packages')),
      packaging_type:       form.get('packaging_type'),
      emergency_contact:    form.get('emergency_contact'),
      remarks:              form.get('remarks'),
    }
    try {
      await dgrService.create(payload)
      navigate('/dgr')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit declaration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/dgr" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">New DGR Declaration</h1>
          <p className="text-sm text-slate-500 mt-0.5">IATA DGR — requires supervisor approval</p>
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
            Link to Air Waybill
          </h2>
          <Select label="Air Waybill (AWB) *" name="awb_id" required>
            <option value="">Select AWB…</option>
            {awbs.map(a => (
              <option key={a.id} value={a.id}>{a.awb_number} — {a.origin}→{a.destination} ({a.commodity})</option>
            ))}
          </Select>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
            DGR Classification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Hazard Class *" name="dgr_class" required>
              <option value="">Select IATA class…</option>
              {DGR_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select label="Packing Group" name="packing_group">
              <option value="">Not applicable</option>
              {PACKING_GROUPS.map(g => <option key={g} value={g}>Packing Group {g}</option>)}
            </Select>
            <Input label="UN Number *"  name="un_number"  placeholder="e.g. UN1993" required />
            <Input label="ERG Code *"   name="erg_code"   placeholder="e.g. 3L, 6C" required />
            <div className="md:col-span-2">
              <Input label="Proper Shipping Name (IATA) *" name="proper_shipping_name" required />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
            Quantity & Packaging
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Net Quantity *"       name="net_quantity"       placeholder="e.g. 45 L, 180 kg" required />
            <Input label="Number of Packages *" name="number_of_packages" type="number" min="1" required />
            <div className="md:col-span-2">
              <Input label="Packaging Type & UN Certification" name="packaging_type" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">4</span>
            Emergency Contact & Remarks
          </h2>
          <div className="space-y-4">
            <Input label="Emergency Contact *" name="emergency_contact" type="tel" required />
            <Textarea label="Remarks / Special Instructions" name="remarks" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/dgr" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-warning px-6">
            {saving ? 'Submitting…' : <><AlertTriangle size={15} /> Submit for Approval</>}
          </button>
        </div>
      </form>
    </div>
  )
}
