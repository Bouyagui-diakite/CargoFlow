import { Activity, Plus, RefreshCw, CheckCircle, XCircle, Upload, Edit2 } from 'lucide-react'
import { PageLoader, ApiError } from '../components/ui/Loading'
import { useApi } from '../hooks/useApi'
import { activityService } from '../services/activity.service'
import { formatDateTime } from '../lib/utils'
import { cn } from '../lib/utils'

const ACTION_STYLES = {
  create:  { color: 'text-blue-400',    bg: 'bg-blue-900/20',    icon: Plus },
  update:  { color: 'text-amber-400',   bg: 'bg-amber-900/20',   icon: Edit2 },
  approve: { color: 'text-emerald-400', bg: 'bg-emerald-900/20', icon: CheckCircle },
  reject:  { color: 'text-red-400',     bg: 'bg-red-900/20',     icon: XCircle },
  upload:  { color: 'text-purple-400',  bg: 'bg-purple-900/20',  icon: Upload },
}

export default function ActivityLog() {
  const { data, loading, error, refetch } = useApi(
    () => activityService.list()
  )
  const logs = data?.data || data || []

  if (loading) return <PageLoader />
  if (error)   return <ApiError error={error} onRetry={refetch} />

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">All system actions — {logs.length} entries</p>
        </div>
        <button onClick={refetch} className="btn-secondary"><RefreshCw size={14}/> Refresh</button>
      </div>

      <div className="card p-5">
        <div className="space-y-0">
          {logs.map((entry, i) => {
            const type  = entry.type || entry.event || 'update'
            const style = ACTION_STYLES[type] || ACTION_STYLES.update
            const Icon  = style.icon
            const user  = entry.user || entry.causer?.name || 'System'
            const action = entry.action || entry.description || entry.event
            const target = entry.target || entry.subject_type
            const detail = entry.detail || ''
            const time   = entry.timestamp || entry.created_at

            return (
              <div key={entry.id} className={cn('flex gap-4 py-4', i < logs.length-1 && 'border-b border-slate-700/50')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', style.bg)}>
                  <Icon size={16} className={style.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-100">
                        <span className="font-semibold">{user}</span>{' '}
                        <span className="text-slate-400">{action}:</span>{' '}
                        <span className={cn('font-mono font-medium', style.color)}>{target}</span>
                      </p>
                      {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
                    </div>
                    <span className="text-xs text-slate-600 whitespace-nowrap shrink-0">{formatDateTime(time)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
