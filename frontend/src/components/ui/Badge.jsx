import { cn, STATUS_COLORS } from '../../lib/utils'

export function Badge({ status, children, className }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-700', text: 'text-slate-300', dot: 'bg-slate-400' }
  return (
    <span className={cn('badge', colors.bg, colors.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      {children || status?.replace('_', ' ')}
    </span>
  )
}

export function DGRBadge({ dgrClass }) {
  return (
    <span className="badge bg-orange-900/50 text-orange-300 border border-orange-700/50">
      <span className="text-orange-400">☢</span>
      DGR {dgrClass}
    </span>
  )
}

export function RoleBadge({ role }) {
  const map = {
    admin:          { bg: 'bg-purple-900/50', text: 'text-purple-300', label: 'Admin' },
    supervisor:     { bg: 'bg-blue-900/50',   text: 'text-blue-300',   label: 'Supervisor' },
    cargo_agent:    { bg: 'bg-cyan-900/50',   text: 'text-cyan-300',   label: 'Cargo Agent' },
    ground_handler: { bg: 'bg-slate-700',     text: 'text-slate-300',  label: 'Ground Handler' },
  }
  const c = map[role] || map.cargo_agent
  return <span className={cn('badge', c.bg, c.text)}>{c.label}</span>
}
