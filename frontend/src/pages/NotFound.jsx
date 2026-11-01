import { Link } from 'react-router-dom'
import { Home, Package2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Package2 size={48} className="text-slate-600 mx-auto" />
        <p className="text-8xl font-bold text-slate-800 select-none">404</p>
        <p className="text-slate-400 text-lg">Page not found</p>
        <Link to="/" className="btn-primary inline-flex mt-4">
          <Home size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
