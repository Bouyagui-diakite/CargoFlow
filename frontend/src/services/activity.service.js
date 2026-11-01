import api from '../lib/api'

export const activityService = {
  list: (params) => api.get('/activity-log', { params }).then(r => r.data),
}
