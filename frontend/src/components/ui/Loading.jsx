import { cn } from '../../lib/utils'

export function Spinner({ size = 20, className }) {
  return (
    <svg
      width={size} height={size}
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} className="text-blue-500" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-700 rounded animate-pulse" style={{ width: `${60 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/3" />
      <div className="h-8 bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-700/50 rounded w-1/4" />
    </div>
  )
}

export function ApiError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
      <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center">
        <span className="text-2xl">⚠</span>
      </div>
      <p className="text-sm text-red-400">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try again
        </button>
      )}
    </div>
  )
}
