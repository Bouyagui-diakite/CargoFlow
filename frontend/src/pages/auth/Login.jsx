import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package2, Eye, EyeOff, Plane } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@cargoflow.mr')
  const [password, setPassword] = useState('admin123')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = login({ email, password })
    setLoading(false)
    if (result.success) navigate('/')
    else setError(result.error)
  }

  const demoAccounts = [
    { email: 'admin@cargoflow.mr', password: 'admin123', role: 'Admin', color: 'text-purple-400' },
    { email: 'super@cargoflow.mr', password: 'super123', role: 'Supervisor', color: 'text-blue-400' },
    { email: 'agent@cargoflow.mr', password: 'agent123', role: 'Cargo Agent', color: 'text-cyan-400' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <Plane
              key={i}
              size={120}
              className="absolute text-blue-400"
              style={{
                top: `${10 + i * 15}%`,
                left: `${-5 + i * 18}%`,
                transform: `rotate(${-30 + i * 10}deg)`,
                opacity: 0.5 - i * 0.06,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center glow-blue">
              <Package2 size={26} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">CargoFlow</p>
              <p className="text-sm text-blue-400">Air Freight Management</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage air freight<br />
            <span className="text-gradient">with precision.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            IATA-compliant AWB management, DGR declarations, automated NOTOC generation, and real-time flight tracking — all in one place.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: 'AWBs Processed', value: '12,400+' },
              { label: 'DGR Approved', value: '1,847' },
              { label: 'On-time Rate', value: '97.3%' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Package2 size={22} className="text-white" />
            </div>
            <p className="text-lg font-bold text-white">CargoFlow</p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your operations account</p>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-6 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">Demo accounts</p>
            <div className="space-y-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-colors group"
                >
                  <div className="text-left">
                    <p className={`text-xs font-semibold ${acc.color}`}>{acc.role}</p>
                    <p className="text-xs text-slate-500 font-mono">{acc.email}</p>
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Use →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
