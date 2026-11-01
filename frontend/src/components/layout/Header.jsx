import { Search, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from './NotificationBell'

const breadcrumbs = {
  '/':          ['Dashboard'],
  '/awb':       ['AWB', 'Air Waybills'],
  '/awb/new':   ['AWB', 'Create AWB'],
  '/dgr':       ['DGR', 'Dangerous Goods'],
  '/dgr/new':   ['DGR', 'New Declaration'],
  '/flights':   ['Flights', 'Flight Management'],
  '/flights/new': ['Flights', 'New Flight'],
  '/users':     ['Users', 'User Management'],
  '/activity':  ['Audit', 'Activity Log'],
  '/notifications': ['Notifications'],
}

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const { user } = useAuth()
  const crumbs = breadcrumbs[location.pathname] || ['CargoFlow']

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center gap-4 px-6 sticky top-0 z-30">
      {/* Mobile menu */}
      <button onClick={onMenuToggle} className="lg:hidden text-slate-400 hover:text-slate-100">
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">CargoFlow</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-slate-600">/</span>
            <span className={i === crumbs.length - 1 ? 'text-slate-100 font-medium' : 'text-slate-500'}>
              {c}
            </span>
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search AWB, flight…"
          className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
        />
      </div>

      {/* Notifications */}
      <NotificationBell />

      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-xs font-bold text-white">
        {user?.avatar}
      </div>
    </header>
  )
}
