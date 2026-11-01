import { cn } from '../../lib/utils'

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  warning:   'btn-warning',
  ghost:     'text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
}

export function Button({ variant = 'primary', className, children, ...props }) {
  return (
    <button className={cn(variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
