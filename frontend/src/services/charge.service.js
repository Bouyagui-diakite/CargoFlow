import api from '../lib/api'

export const chargeService = {
  get:      (awbId)       => api.get(`/awbs/${awbId}/charges`).then(r => r.data),
  update:   (awbId, data) => api.patch(`/awbs/${awbId}/charges`, data).then(r => r.data),
  markPaid: (awbId, data) => api.patch(`/awbs/${awbId}/charges/pay`, data).then(r => r.data),
}

export const PAYMENT_METHODS = [
  { value: 'bankily',       label: 'Bankily',       icon: '🟠', desc: 'Orange Money' },
  { value: 'masrivi',       label: 'Masrivi',        icon: '🔵', desc: 'Chinguitty Tech' },
  { value: 'sedad',         label: 'Sedad',          icon: '🟣', desc: 'Sedad Pay' },
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: '🏦', desc: 'Wire transfer' },
  { value: 'cash',          label: 'Cash',           icon: '💵', desc: 'Physical cash' },
  { value: 'check',         label: 'Check',          icon: '📝', desc: 'Bank check' },
]
