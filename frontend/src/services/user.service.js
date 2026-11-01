import api from '../lib/api'

export const userService = {
  list:         (params)   => api.get('/users', { params }).then(r => r.data),
  get:          (id)       => api.get(`/users/${id}`).then(r => r.data),
  create:       (data)     => api.post('/users', data).then(r => r.data),
  update:       (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  toggleStatus: (id)       => api.patch(`/users/${id}/toggle-status`).then(r => r.data),
  remove:       (id)       => api.delete(`/users/${id}`).then(r => r.data),
}
