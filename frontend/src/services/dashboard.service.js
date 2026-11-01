import api from '../lib/api'

export const dashboardService = {
  stats: () => api.get('/dashboard').then(r => r.data),
}
