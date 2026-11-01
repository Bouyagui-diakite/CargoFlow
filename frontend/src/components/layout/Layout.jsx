import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { cn } from '../../lib/utils'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-300',
        collapsed ? 'ml-16' : 'ml-60',
      )}>
        <Header onMenuToggle={() => setCollapsed(c => !c)} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
