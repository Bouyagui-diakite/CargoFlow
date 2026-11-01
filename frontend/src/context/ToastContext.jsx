import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../lib/utils'

const ToastContext = createContext(null)

const ICONS  = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }
const COLORS = {
  success: 'bg-emerald-900/90 border-emerald-700/60 text-emerald-200',
  error:   'bg-red-900/90 border-red-700/60 text-red-200',
  warning: 'bg-amber-900/90 border-amber-700/60 text-amber-200',
  info:    'bg-blue-900/90 border-blue-700/60 text-blue-200',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-80">
        {toasts.map(toast => {
          const Icon = ICONS[toast.type] || Info
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium pointer-events-auto animate-fade-in',
                COLORS[toast.type] || COLORS.info,
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{toast.msg}</span>
              <button onClick={() => dismiss(toast.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
