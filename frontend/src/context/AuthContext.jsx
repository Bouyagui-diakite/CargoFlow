import { createContext, useContext, useState } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cargoflow_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)
      // Laravel Sanctum returns: { token, user }
      localStorage.setItem('cargoflow_token', data.token)
      localStorage.setItem('cargoflow_user', JSON.stringify(data.user))
      setUser(data.user)
      // Fetch full profile to get server-side permissions (Spatie)
      try {
        const profile = await authService.me()
        const fullUser = { ...data.user, ...profile }
        localStorage.setItem('cargoflow_user', JSON.stringify(fullUser))
        setUser(fullUser)
      } catch { /* proceed with login-response user if /me fails */ }
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password'
      return { success: false, error: msg }
    }
  }

  const logout = async () => {
    try { await authService.logout() } catch { /* ignore */ }
    localStorage.removeItem('cargoflow_token')
    localStorage.removeItem('cargoflow_user')
    setUser(null)
  }

  const can = (permission) => {
    if (!user) return false
    // Use API-provided permissions array if available (populated after /me call)
    if (Array.isArray(user.permissions)) {
      return user.permissions.includes(permission)
    }
    // Fallback: hardcoded role map used until /me responds with permissions
    const perms = {
      admin:          ['create_awb', 'edit_awb', 'delete_awb', 'approve_dgr', 'create_dgr', 'manage_users', 'view_logs', 'manage_flights', 'view_dashboard', 'block_shipment', 'process_shipment'],
      supervisor:     ['create_awb', 'edit_awb', 'approve_dgr', 'create_dgr', 'view_logs', 'manage_flights', 'view_dashboard', 'process_shipment'],
      cargo_agent:    ['create_awb', 'edit_awb'],
      ground_handler: [],
    }
    return perms[user.role]?.includes(permission) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
