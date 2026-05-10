import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'My Work' },
  { to: '/projects', label: 'Projects' },
]

const adminItems = [{ to: '/admin', label: 'Users' }]

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="w-56 bg-slate-900 text-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-700/70 flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" />
          <circle cx="26" cy="16" r="2.5" fill="#7AA2FF" />
        </svg>
        <span className="text-lg font-bold tracking-tight text-white">Orchestro</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
        {user?.role === 'ADMIN' &&
          adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700/70 text-xs text-gray-400">
        <div className="font-medium text-gray-200">{user?.username}</div>
        <div>{user?.role}</div>
      </div>
    </aside>
  )
}
