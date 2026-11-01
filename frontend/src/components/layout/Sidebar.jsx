import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, AlertTriangle, Plane,
  Users, Activity, ChevronRight, Package2,
  LogOut, Shield, FolderOpen, ArrowDownToLine, ArrowUpFromLine, CreditCard,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard, exact: true, permission: 'view_dashboard' },
  { to: '/awb',       label: 'AWB',        icon: FileText },
  { to: '/import',    label: 'Import',     icon: ArrowDownToLine },
  { to: '/export',    label: 'Export',     icon: ArrowUpFromLine },
  { to: '/dgr',       label: 'DGR',        icon: AlertTriangle, badge: 'HOT', badgeColor: 'bg-orange-500' },
  { to: '/flights',   label: 'Flights',    icon: Plane },
  { to: '/payments',  label: 'Payments',   icon: CreditCard },
  { to: '/documents', label: 'Documents',  icon: FolderOpen },
  { to: '/users',     label: 'Users',      icon: Users,    adminOnly: true },
  { to: '/activity',  label: 'Audit Log',  icon: Activity, adminOnly: true },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, can } = useAuth()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 fixed left-0 top-0 z-40',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 glow-blue">
          <Package2 size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-base leading-tight">CargoFlow</p>
            <p className="text-xs text-slate-500 font-medium">Air Freight</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
            Operations
          </p>
        )}
        {navItems
          .filter(item => (!item.adminOnly || can('manage_users')) && (!item.permission || can(item.permission)))
          .map(item => {
            const Icon = item.icon
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'nav-item relative',
                  isActive ? 'nav-item-active' : 'nav-item-inactive',
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white', item.badgeColor)}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} className="text-blue-300 ml-auto" />}
                  </>
                )}
              </NavLink>
            )
          })}
      </nav>

      {/* User / collapse */}
      <div className="border-t border-slate-800 p-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <Shield size={14} className={user?.role === 'admin' ? 'text-purple-400' : 'text-slate-600'} />
          </div>
        )}

        <button
          onClick={onToggle}
          className="nav-item nav-item-inactive w-full"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronRight size={18} className={cn('transition-transform duration-300', !collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>

        <button
          onClick={logout}
          className="nav-item nav-item-inactive w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          title="Logout"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
