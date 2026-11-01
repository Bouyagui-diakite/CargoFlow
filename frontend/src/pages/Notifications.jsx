import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, CheckCircle2, XCircle, PackageX, Plane, UserPlus, PartyPopper, Info, Check, Loader2,
} from 'lucide-react'
import { notificationService } from '../services/notification.service'
import { timeAgo, cn } from '../lib/utils'
import { useToast } from '../context/ToastContext'

const META = {
  dgr_pending:     { Icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-900/20' },
  dgr_approved:    { Icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  dgr_rejected:    { Icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-900/20' },
  awb_blocked:     { Icon: PackageX,      color: 'text-red-400',     bg: 'bg-red-900/20' },
  flight_overload: { Icon: Plane,         color: 'text-amber-400',   bg: 'bg-amber-900/20' },
  user_registered: { Icon: UserPlus,      color: 'text-blue-400',    bg: 'bg-blue-900/20' },
  welcome:         { Icon: PartyPopper,   color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  info:            { Icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-900/20' },
}

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
]

export default function Notifications() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [filter, setFilter]   = useState('all')
  const [items, setItems]     = useState([])
  const [page, setPage]       = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (pageNum, currentFilter, append) => {
    setLoading(true)
    try {
      const params = { page: pageNum }
      if (currentFilter === 'unread') params.unread = 1
      const res = await notificationService.list(params)
      setLastPage(res.last_page || 1)
      setItems(prev => (append ? [...prev, ...(res.data || [])] : (res.data || [])))
    } catch {
      showToast('Failed to load notifications.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { setPage(1); load(1, filter, false) }, [filter, load])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(next, filter, true)
  }

  const onItemClick = async (n) => {
    if (!n.read_at) {
      try { await notificationService.markRead(n.id) } catch { /* ignore */ }
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i))
    }
    if (n.link) navigate(n.link)
  }

  const onMarkAll = async () => {
    try {
      await notificationService.markAllRead()
      setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })))
      showToast('All notifications marked as read.')
      if (filter === 'unread') load(1, filter, false)
    } catch {
      showToast('Failed to mark all as read.', 'error')
    }
  }

  const hasUnread = items.some(i => !i.read_at)

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your full notification history</p>
        </div>
        {hasUnread && (
          <button onClick={onMarkAll} className="btn-secondary">
            <Check size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              filter === f.key
                ? 'border-blue-500 text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden divide-y divide-slate-800/60">
        {!loading && items.length === 0 && (
          <div className="text-center py-16 px-4">
            <Bell size={32} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">No notifications</p>
            <p className="text-slate-600 text-sm mt-1">
              {filter === 'unread' ? "You've read everything." : 'Notifications about DGR approvals, blocked shipments and more will appear here.'}
            </p>
          </div>
        )}

        {items.map(n => {
          const { Icon, color, bg } = META[n.type] || META.info
          return (
            <button
              key={n.id}
              onClick={() => onItemClick(n)}
              className={cn(
                'w-full text-left px-4 py-4 flex gap-3.5 transition-colors hover:bg-slate-800/40',
                !n.read_at && 'bg-blue-950/20',
              )}
            >
              <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bg)}>
                <Icon size={18} className={color} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-100">{n.title}</p>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
                {n.message && <p className="text-sm text-slate-400 mt-0.5">{n.message}</p>}
                <p className="text-xs text-slate-600 mt-1.5">{timeAgo(n.created_at)}</p>
              </div>
            </button>
          )
        })}

        {loading && (
          <div className="flex items-center justify-center py-6 text-slate-500 text-sm gap-2">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </div>
        )}
      </div>

      {page < lastPage && !loading && (
        <div className="flex justify-center">
          <button onClick={loadMore} className="btn-secondary">Load more</button>
        </div>
      )}
    </div>
  )
}
