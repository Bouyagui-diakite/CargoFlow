import api from '../lib/api'

export const dgrService = {
  list:            (params)          => api.get('/dgr', { params }).then(r => r.data),
  get:             (id)              => api.get(`/dgr/${id}`).then(r => r.data),
  create:          (data)            => api.post('/dgr', data).then(r => r.data),
  update:          (id, data)        => api.put(`/dgr/${id}`, data).then(r => r.data),
  approve:         (id)              => api.patch(`/dgr/${id}/approve`).then(r => r.data),
  reject:          (id, reason)      => api.patch(`/dgr/${id}/reject`, { reason }).then(r => r.data),
  getNOTOC:        (id)              => api.get(`/dgr/${id}/notoc`).then(r => r.data),
  downloadNOTOC:   (id)              => api.get(`/dgr/${id}/notoc/pdf`, { responseType: 'blob' }).then(r => r.data),
}
