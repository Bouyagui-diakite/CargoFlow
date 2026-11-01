import { cn } from '../../lib/utils'

export function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      <input className={cn('input-field', error && 'border-red-500 focus:ring-red-500', className)} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, error, className, children, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      <select
        className={cn(
          'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      <textarea
        className={cn('input-field resize-none', error && 'border-red-500', className)}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
