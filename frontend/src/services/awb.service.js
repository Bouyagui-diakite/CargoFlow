import api from '../lib/api'

export const awbService = {
  list:         (params)      => api.get('/awbs', { params }).then(r => r.data),
  get:          (id)          => api.get(`/awbs/${id}`).then(r => r.data),
  create:       (data)        => api.post('/awbs', data).then(r => r.data),
  update:       (id, data)    => api.put(`/awbs/${id}`, data).then(r => r.data),
  updateStatus: (id, payload) => api.patch(`/awbs/${id}/status`, payload).then(r => r.data),
  remove:       (id)          => api.delete(`/awbs/${id}`).then(r => r.data),
  downloadPDF:  (id)          => api.get(`/awbs/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
}
