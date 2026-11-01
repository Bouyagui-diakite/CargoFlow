import api from '../lib/api'

export const flightService = {
  list:      (params)       => api.get('/flights', { params }).then(r => r.data),
  get:       (id)           => api.get(`/flights/${id}`).then(r => r.data),
  create:    (data)         => api.post('/flights', data).then(r => r.data),
  update:    (id, data)     => api.put(`/flights/${id}`, data).then(r => r.data),
  remove:    (id)           => api.delete(`/flights/${id}`).then(r => r.data),
  assignAWB:    (flightId, awbId) => api.post(`/flights/${flightId}/awbs/${awbId}`).then(r => r.data),
  removeAWB:    (flightId, awbId) => api.delete(`/flights/${flightId}/awbs/${awbId}`).then(r => r.data),
  downloadNOTOC:(id) => api.get(`/flights/${id}/notoc/pdf`, { responseType: 'blob' }).then(r => r.data),
}
