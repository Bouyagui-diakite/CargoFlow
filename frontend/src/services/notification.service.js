import api from '../lib/api'

export const notificationService = {
  list:        (params) => api.get('/notifications', { params }).then(r => r.data),
  unreadCount: ()       => api.get('/notifications/unread-count').then(r => r.data),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: ()       => api.patch('/notifications/read-all').then(r => r.data),
  remove:      (id)     => api.delete(`/notifications/${id}`).then(r => r.data),
}
