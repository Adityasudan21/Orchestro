import { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ChangePasswordDialog } from '../common/ChangePasswordDialog'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'My Work' },
  { to: '/my-projects', label: 'My Projects' },
  { to: '/projects', label: 'All Projects' },
]

const adminItems = [{ to: '/admin', label: 'Users' }]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openDropdown() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setDropdownOpen(true)
  }

  function scheduleClose() {
    hideTimer.current = setTimeout(() => setDropdownOpen(false), 300)
  }

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

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
      {/* User section — hover to reveal dropdown */}
      <div
        className="relative border-t border-slate-700/70"
        onMouseEnter={openDropdown}
        onMouseLeave={scheduleClose}
      >
        <div className="px-5 py-4 flex items-center gap-3 cursor-pointer select-none">
          <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 min-w-0">
            <div className="font-medium text-gray-200 truncate">{user?.username}</div>
            <div className="truncate">{user?.role}</div>
          </div>
          <svg className={`ml-auto w-3.5 h-3.5 transition-colors flex-shrink-0 ${dropdownOpen ? 'text-slate-300' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>

        {/* Dropdown */}
        <div
          onMouseEnter={openDropdown}
          onMouseLeave={scheduleClose}
          className={`absolute bottom-full left-2 right-2 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden transition-all duration-150 origin-bottom z-50 ${
            dropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <button
            onClick={() => { setShowChangePassword(true); setDropdownOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Change Password
          </button>
          <div className="border-t border-slate-700/60" />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      <ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </aside>
  )
}
