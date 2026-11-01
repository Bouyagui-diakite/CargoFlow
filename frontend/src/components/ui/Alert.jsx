import { AlertTriangle, XCircle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const variants = {
  error:   { bg: 'bg-red-900/30 border-red-700/50', text: 'text-red-300', icon: XCircle,       iconColor: 'text-red-400' },
  warning: { bg: 'bg-amber-900/30 border-amber-700/50', text: 'text-amber-300', icon: AlertTriangle, iconColor: 'text-amber-400' },
  success: { bg: 'bg-emerald-900/30 border-emerald-700/50', text: 'text-emerald-300', icon: CheckCircle, iconColor: 'text-emerald-400' },
  info:    { bg: 'bg-blue-900/30 border-blue-700/50', text: 'text-blue-300', icon: Info,         iconColor: 'text-blue-400' },
}

export function Alert({ variant = 'info', title, children, onClose, className }) {
  const v = variants[variant]
  const Icon = v.icon
  return (
    <div className={cn('flex gap-3 p-4 rounded-xl border', v.bg, className)}>
      <Icon size={18} className={cn('mt-0.5 shrink-0', v.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold mb-0.5', v.text)}>{title}</p>}
        <p className={cn('text-xs', v.text)}>{children}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className={cn('shrink-0', v.iconColor, 'hover:opacity-70 transition-opacity')}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
