import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { AirportInput } from '../../components/ui/AirportInput'
import { Alert } from '../../components/ui/Alert'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi } from '../../hooks/useApi'
import { awbService } from '../../services/awb.service'
import { flightService } from '../../services/flight.service'

const HANDLING_CODES = ['PER','ICE','HEA','MED','PRI','CAO','ELE','HUM','AVI','VAL','DIP','PES']

export default function AWBEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)
  const [handling, setHandling] = useState([])

  const { data: awb, loading, error: loadError, refetch } = useApi(() => awbService.get(id), [id])
  const { data: flightsData } = useApi(() => flightService.list({ status: 'scheduled' }))
  const flights = flightsData?.data || flightsData || []

  useEffect(() => {
    if (awb) setHandling(awb.special_handling || [])
  }, [awb])

  const toggle = (code) =>
    setHandling(h => h.includes(code) ? h.filter(c => c !== code) : [...h, code])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = new FormData(e.target)
    const payload = {
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
    }
    try {
      await awbService.update(id, payload)
      navigate(`/awb/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update AWB.')
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (loadError) return <ApiError error={loadError} onRetry={refetch} />

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to={`/awb/${id}`} className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Edit AWB</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">{awb?.awb_number}</p>
        </div>
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
            <AirportInput label="Origin Airport *" name="origin" required defaultValue={awb?.origin || ''} />
            <AirportInput label="Destination Airport *" name="destination" required defaultValue={awb?.destination || ''} />
            <Select label="Assign to Flight" name="flight_id" defaultValue={awb?.flight_id || ''}>
              <option value="">No flight assigned</option>
              {flights.map(f => (
                <option key={f.id} value={f.id}>{f.flight_number} — {f.origin}→{f.destination}</option>
              ))}
            </Select>
            <Input label="Pieces *"            name="pieces"    type="number" min="1"   required defaultValue={awb?.pieces} />
            <Input label="Gross Weight (kg) *" name="weight_kg" type="number" min="0.1" step="0.1" required defaultValue={awb?.weight_kg} />
            <Input label="Volume (m³)"         name="volume_m3" type="number" min="0"   step="0.01" defaultValue={awb?.volume_m3 || ''} />
            <div className="md:col-span-3">
              <Input label="Commodity Description *" name="commodity" required defaultValue={awb?.commodity} />
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
            <Input label="Company / Full Name *" name="shipper_name" required defaultValue={awb?.shipper_name} />
            <Input label="Country Code *" name="shipper_country" placeholder="MR" maxLength={2} className="uppercase" required defaultValue={awb?.shipper_country} />
            <div className="md:col-span-2">
              <Textarea label="Address *" name="shipper_address" required defaultValue={awb?.shipper_address} />
            </div>
          </div>
        </div>

        {/* Consignee */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
            Consignee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company / Full Name *" name="consignee_name" required defaultValue={awb?.consignee_name} />
            <Input label="Country Code *" name="consignee_country" placeholder="FR" maxLength={2} className="uppercase" required defaultValue={awb?.consignee_country} />
            <div className="md:col-span-2">
              <Textarea label="Address *" name="consignee_address" required defaultValue={awb?.consignee_address} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to={`/awb/${id}`} className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary px-6">
            {saving ? 'Saving…' : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  )
}
