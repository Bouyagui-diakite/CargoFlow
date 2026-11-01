import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { AirportInput } from '../../components/ui/AirportInput'
import { Alert } from '../../components/ui/Alert'
import { useApi } from '../../hooks/useApi'
import { awbService } from '../../services/awb.service'
import { dgrService } from '../../services/dgr.service'
import { flightService } from '../../services/flight.service'
import { DGR_CLASSES, PACKING_GROUPS, getAWBPrefix } from '../../lib/utils'

const HANDLING_CODES = ['PER','ICE','HEA','MED','PRI','CAO','ELE','HUM','AVI','VAL','DIP','PES']

export default function AWBCreate() {
  const navigate = useNavigate()
  const [isDGR,    setIsDGR]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)
  const [handling, setHandling] = useState([])

  const { data: flightsData } = useApi(() => flightService.list({ status: 'scheduled' }))
  const flights = flightsData?.data || flightsData || []

  const [selectedFlightId, setSelectedFlightId] = useState('')
  const selectedFlight = flights.find(f => String(f.id) === String(selectedFlightId))
  const awbPrefix = getAWBPrefix(selectedFlight?.flight_number || '')

  const toggle = code => setHandling(h => h.includes(code) ? h.filter(c => c !== code) : [...h, code])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = new FormData(e.target)
    const awbPayload = {
      origin:            form.get('origin'),
      destination:       form.get('destination'),
      flight_id:         form.get('flight_id') || null,
      pieces:            Number(form.get('pieces')),
      weight_kg:         Number(form.get('weight_kg')),
      volume_m3:         form.get('volume_m3') ? Number(form.get('volume_m3')) : null,
      commodity:         form.get('commodity'),
      special_handling:  handling,
      shipper_name:      form.get('shipper_name'),
      shipper_address:   form.get('shipper_address'),
      shipper_country:   form.get('shipper_country'),
      consignee_name:    form.get('consignee_name'),
      consignee_address: form.get('consignee_address'),
      consignee_country: form.get('consignee_country'),
      is_dgr:            isDGR,
    }
    try {
      const awb = await awbService.create(awbPayload)
      if (isDGR) {
        await dgrService.create({
          awb_id:               awb.id,
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
        })
      }
      navigate('/awb')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create AWB. Please check all required fields.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/awb" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-slate-100">Create Air Waybill</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Shipment */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
            Shipment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AirportInput label="Origin Airport *" name="origin" required />
            <AirportInput label="Destination Airport *" name="destination" required />
            <div>
              <Select label="Assign to Flight" name="flight_id"
                onChange={e => setSelectedFlightId(e.target.value)}>
                <option value="">No flight assigned</option>
                {flights.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.flight_number} — {f.origin}→{f.destination}
                  </option>
                ))}
              </Select>
              {selectedFlight && (
                <p className="text-xs text-slate-500 mt-1">
                  AWB prefix: <span className="font-mono font-bold text-blue-400">{awbPrefix}-</span>
                  <span className="text-slate-600 ml-1">({selectedFlight.flight_number})</span>
                </p>
              )}
            </div>
            <Input label="Pieces *"            name="pieces"    type="number" min="1"   required />
            <Input label="Gross Weight (kg) *" name="weight_kg" type="number" min="0.1" step="0.1" required />
            <Input label="Volume (m³)"         name="volume_m3" type="number" min="0"   step="0.01" />
            <div className="md:col-span-3">
              <Input label="Commodity Description *" name="commodity" required />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Special Handling Codes</label>
            <div className="flex flex-wrap gap-2">
              {HANDLING_CODES.map(code => (
                <button key={code} type="button" onClick={() => toggle(code)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    handling.includes(code)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400'
                  }`}>
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shipper */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
            Shipper
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company / Full Name *" name="shipper_name" required />
            <Input label="Country Code *" name="shipper_country" placeholder="MR" maxLength={2} className="uppercase" required />
            <div className="md:col-span-2"><Textarea label="Address *" name="shipper_address" required /></div>
          </div>
        </div>

        {/* Consignee */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
            Consignee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company / Full Name *" name="consignee_name" required />
            <Input label="Country Code *" name="consignee_country" placeholder="FR" maxLength={2} className="uppercase" required />
            <div className="md:col-span-2"><Textarea label="Address *" name="consignee_address" required /></div>
          </div>
        </div>

        {/* DGR */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">4</span>
            Dangerous Goods
          </h2>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div onClick={() => setIsDGR(d => !d)} className={`w-12 h-6 rounded-full relative transition-colors ${isDGR ? 'bg-orange-600' : 'bg-slate-700'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDGR ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Contains Dangerous Goods (DGR)</p>
              <p className="text-xs text-slate-500">Requires supervisor approval — NOTOC auto-generated</p>
            </div>
          </label>
          {isDGR && (
            <div className="space-y-4 border-t border-slate-700 pt-4 animate-fade-in">
              <Alert variant="warning" title="IATA DGR Compliance Required">
                All declarations must comply with IATA DGR 65th Edition.
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Hazard Class *" name="dgr_class" required>
                  <option value="">Select class…</option>
                  {DGR_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
                <Select label="Packing Group" name="packing_group">
                  <option value="">Not applicable</option>
                  {PACKING_GROUPS.map(g => <option key={g} value={g}>Packing Group {g}</option>)}
                </Select>
                <Input label="UN Number *"  name="un_number"  placeholder="UN1993" required />
                <Input label="ERG Code *"   name="erg_code"   placeholder="3L" required />
                <div className="md:col-span-2"><Input label="Proper Shipping Name (IATA) *" name="proper_shipping_name" required /></div>
                <Input label="Net Quantity *"       name="net_quantity"       required />
                <Input label="Number of Packages *" name="number_of_packages" type="number" min="1" required />
                <div className="md:col-span-2"><Input label="Packaging Type" name="packaging_type" /></div>
                <Input label="Emergency Contact *" name="emergency_contact" type="tel" required />
                <div className="md:col-span-2"><Textarea label="Remarks" name="remarks" /></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/awb" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary px-6">
            {saving ? 'Saving…' : <><Save size={15} /> Create AWB</>}
          </button>
        </div>
      </form>
    </div>
  )
}
