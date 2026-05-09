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
    <aside className="w-56 bg-gray-900 text-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 text-xl font-bold text-white border-b border-gray-700">
        Orchestro
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
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-400">
        <div className="font-medium text-gray-200">{user?.username}</div>
        <div>{user?.role}</div>
      </div>
    </aside>
  )
}
