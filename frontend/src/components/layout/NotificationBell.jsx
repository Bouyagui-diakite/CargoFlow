import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, CheckCircle2, XCircle, PackageX, Plane, UserPlus, PartyPopper, Info, Check,
} from 'lucide-react'
import { notificationService } from '../../services/notification.service'
import { timeAgo, cn } from '../../lib/utils'

// Icon + accent per notification type.
const META = {
  dgr_pending:     { Icon: AlertTriangle, color: 'text-amber-400' },
  dgr_approved:    { Icon: CheckCircle2,  color: 'text-emerald-400' },
  dgr_rejected:    { Icon: XCircle,       color: 'text-red-400' },
  awb_blocked:     { Icon: PackageX,      color: 'text-red-400' },
  flight_overload: { Icon: Plane,         color: 'text-amber-400' },
  user_registered: { Icon: UserPlus,      color: 'text-blue-400' },
  welcome:         { Icon: PartyPopper,   color: 'text-emerald-400' },
  info:            { Icon: Info,          color: 'text-blue-400' },
}

const POLL_MS = 30000

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen]   = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  const loadCount = useCallback(async () => {
    try { setUnread((await notificationService.unreadCount()).count) } catch { /* ignore */ }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationService.list()
      setItems(res?.data || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  // Poll the unread badge.
  useEffect(() => {
    loadCount()
    const t = setInterval(loadCount, POLL_MS)
    return () => clearInterval(t)
  }, [loadCount])

  // Load the list when the panel opens.
  useEffect(() => { if (open) loadList() }, [open, loadList])

  // Close on outside click.
  useEffect(() => {
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onItemClick = async (n) => {
    if (!n.read_at) {
      try { await notificationService.markRead(n.id) } catch { /* ignore */ }
      setItems(prev => prev.map(i => i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i))
      setUnread(c => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const onMarkAll = async () => {
    try { await notificationService.markAllRead() } catch { /* ignore */ }
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full ring-2 ring-slate-900 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <p className="font-semibold text-slate-100 text-sm">
              Notifications {unread > 0 && <span className="text-slate-500 font-normal">· {unread} unread</span>}
            </p>
            {unread > 0 && (
              <button onClick={onMarkAll} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto">
            {loading && items.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <div className="text-center py-10 px-4">
                <Bell size={28} className="mx-auto text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm">You're all caught up.</p>
              </div>
            )}
            {items.map(n => {
              const { Icon, color } = META[n.type] || META.info
              return (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex gap-3 border-b border-slate-800/60 transition-colors hover:bg-slate-800/60',
                    !n.read_at && 'bg-blue-950/30',
                  )}
                >
                  <Icon size={17} className={cn('shrink-0 mt-0.5', color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100 truncate">{n.title}</p>
                    {n.message && <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>}
                    <p className="text-[11px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/notifications') }}
            className="w-full text-center py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-800/60 border-t border-slate-800 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
