import api from '../lib/api'

export const authService = {
  login:  (credentials) => api.post('/login', credentials).then(r => r.data),
  logout: ()            => api.post('/logout').then(r => r.data),
  me:     ()            => api.get('/me').then(r => r.data),
}
