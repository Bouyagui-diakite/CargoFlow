import { useEffect, useState } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import {
  FileText, AlertTriangle, Plane, Package, TrendingUp,
  XCircle, Clock, CheckCircle, ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { SkeletonCard, PageLoader } from '../components/ui/Loading'
import { dashboardService } from '../services/dashboard.service'
import { formatWeight } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="stat-card">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-6 -mt-6 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-100">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
          <Icon size={22} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">+{trend}% vs last month</span>
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="text-white">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.stats()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const s          = data?.stats         || {}
  const trend      = data?.trend         || []
  const breakdown  = data?.cargo_breakdown || []
  const recentAWBs = data?.recent_awbs   || []
  const activeFlights = data?.active_flights || []
  const alerts     = data?.alerts        || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Good morning, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Operations overview</p>
        </div>
        <Link to="/awb/new" className="btn-primary"><FileText size={16} /> New AWB</Link>
      </div>

      {/* Alerts */}
      {!loading && (alerts.blocked?.length > 0 || alerts.pending_dgr?.length > 0 || alerts.overloaded?.length > 0) && (
        <div className="space-y-2">
          {(alerts.blocked || []).map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3">
              <XCircle size={18} className="text-red-400 shrink-0" />
              <span className="text-sm font-semibold text-red-300 flex-1">
                Blocked: {a.awb_number} — {a.block_reason}
              </span>
              <Link to={`/awb/${a.id}`} className="text-xs text-red-300 hover:text-red-100 flex items-center gap-1">
                View <ArrowRight size={12} />
              </Link>
            </div>
          ))}
          {(alerts.pending_dgr || []).map(d => (
            <div key={d.id} className="flex items-center gap-3 bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-amber-300 flex-1">
                DGR Pending: {d.un_number} — {d.proper_shipping_name}
              </span>
              <Link to="/dgr" className="text-xs text-amber-300 hover:text-amber-100 flex items-center gap-1">
                Review <ArrowRight size={12} />
              </Link>
            </div>
          ))}
          {(alerts.overloaded || []).map(f => (
            <div key={f.id} className="flex items-center gap-3 bg-orange-900/20 border border-orange-700/40 rounded-xl px-4 py-3">
              <Plane size={18} className="text-orange-400 shrink-0" />
              <span className="text-sm font-semibold text-orange-300 flex-1">
                Overloaded: {f.flight_number} ({f.origin}→{f.destination})
              </span>
              <Link to="/flights" className="text-xs text-orange-300 flex items-center gap-1">
                View <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total AWBs"     value={s.totalAWBs}        icon={FileText}      color="bg-blue-500"    trend={12} />
            <StatCard label="Active Flights" value={s.activeFlights}    icon={Plane}         color="bg-cyan-500"    sub="In operation" />
            <StatCard label="Pending DGR"    value={s.pendingDGRs}      icon={AlertTriangle} color="bg-orange-500"  sub="Awaiting approval" />
            <StatCard label="Blocked"        value={s.blockedShipments} icon={XCircle}       color="bg-red-500"     sub="Requires action" />
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Delivered (Week)"  value={s.deliveredThisWeek}  icon={CheckCircle} color="bg-emerald-500" trend={8} />
            <StatCard label="Total Weight"      value={formatWeight(s.totalWeightKg || 0)} icon={Package} color="bg-slate-500" />
            <StatCard label="Revenue"           value={`${((s.revenueUSD||0)/1000).toFixed(0)}K MRU`} icon={TrendingUp} color="bg-purple-500" trend={5} />
            <StatCard label="On-time Rate"      value="97.3%"                icon={Clock}       color="bg-green-500" />
          </div>
        </>
      )}

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5 xl:col-span-2">
            <h3 className="section-title mb-1">Shipment Trends</h3>
            <p className="text-xs text-slate-500 mb-5">AWBs & DGR events — last 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gAWB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDGR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="awbs"      name="AWBs"       stroke="#3b82f6" fill="url(#gAWB)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="dgrEvents" name="DGR Events" stroke="#f97316" fill="url(#gDGR)" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-1">Cargo Mix</h3>
            <p className="text-xs text-slate-500 mb-4">By shipment type</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {breakdown.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-slate-300 font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent AWBs + Active flights */}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Recent AWBs</h3>
              <Link to="/awb" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View all <ArrowRight size={12}/></Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left pb-3 pr-4">AWB</th>
                  <th className="text-left pb-3 pr-4">Route</th>
                  <th className="text-left pb-3 pr-4">Weight</th>
                  <th className="text-left pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentAWBs.map(awb => (
                  <tr key={awb.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-2.5 pr-4">
                      <Link to={`/awb/${awb.id}`} className="font-mono text-blue-400 hover:text-blue-300 text-xs font-semibold">
                        {awb.awb_number}
                      </Link>
                      {awb.is_dgr && <span className="ml-2 text-[10px] bg-orange-900/50 text-orange-300 px-1.5 py-0.5 rounded font-bold">DGR</span>}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{awb.origin} → {awb.destination}</td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">{formatWeight(awb.weight_kg)}</td>
                    <td className="py-2.5"><Badge status={awb.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Active Flights</h3>
              <Link to="/flights" className="text-xs text-blue-400 flex items-center gap-1">All <ArrowRight size={12}/></Link>
            </div>
            <div className="space-y-3">
              {activeFlights.map(f => {
                const loaded   = f.loaded_kg   || 0
                const capacity = f.capacity_kg || 1
                const pct      = Math.round(loaded / capacity * 100)
                return (
                  <div key={f.id} className="bg-slate-900 rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-slate-100 text-sm">{f.flight_number}</span>
                      <Badge status={f.status} />
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-2">{f.origin} <span className="text-blue-400 mx-1">→</span> {f.destination}</p>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Load</span>
                        <span className={pct >= 100 ? 'text-red-400 font-semibold' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct,100)}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
