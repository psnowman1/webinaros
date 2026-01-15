import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  MessageSquare,
  GitBranch,
  BarChart3,
  Plug,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/webinars', icon: Video, label: 'Webinars' },
  { to: '/messaging', icon: MessageSquare, label: 'Email & SMS' },
  { to: '/sequences', icon: GitBranch, label: 'Sequences' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border bg-sidebar hidden md:block overflow-y-auto">
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
