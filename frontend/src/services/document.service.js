import api from '../lib/api'

export const documentService = {
  list:     (params)   => api.get('/documents', { params }).then(r => r.data),
  upload:   (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  download: (id)       => api.get(`/documents/${id}`, { responseType: 'blob' }).then(r => r.data),
  remove:   (id)       => api.delete(`/documents/${id}`).then(r => r.data),
}
