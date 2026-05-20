import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { ChangePasswordDialog } from '../common/ChangePasswordDialog'
import { notificationsApi } from '../../api/notifications.api'
import { timeAgo } from '../../utils/timeAgo'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'My Work' },
  { to: '/my-projects', label: 'My Projects' },
  { to: '/projects', label: 'All Projects' },
]

const adminItems = [{ to: '/admin', label: 'Users' }]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getMy,
  })
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!dropdownOpen) return
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [dropdownOpen])

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-full z-40 w-64 flex flex-col bg-slate-900 text-gray-200 transition-transform duration-300 ease-in-out',
        'md:relative md:w-56 md:h-screen md:sticky md:top-0 md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="px-5 py-5 border-b border-slate-700/70 flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" />
          <circle cx="26" cy="16" r="2.5" fill="#7AA2FF" />
        </svg>
        <span className="text-lg font-bold tracking-tight text-white">Orchestro</span>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden ml-auto text-gray-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Notification bell */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span className="relative">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.982M9 17H4l1.405-1.405A2.032 2.032 0 006 14.158V11a6 6 0 016-6 6 6 0 016 6v3.159" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            Notifications
          </button>
          {notifOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={() => markAllMutation.mutate()} className="text-[10px] text-blue-400 hover:text-blue-300">
                    Mark all read
                  </button>
                )}
              </div>
              {notifications?.length === 0 && (
                <p className="text-xs text-gray-500 italic px-3 py-3">No notifications yet.</p>
              )}
              {notifications?.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markReadMutation.mutate(n.id) }}
                  className={`px-3 py-2.5 border-b border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-700/40 transition-colors ${n.read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />}
                    <div className={!n.read ? '' : 'ml-3.5'}>
                      <p className="text-xs text-gray-200 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
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
              onClick={onClose}
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

      {/* User section — click to reveal dropdown */}
      <div ref={dropdownRef} className="relative border-t border-slate-700/70">
        <div
          onClick={() => setDropdownOpen((v) => !v)}
          className="px-5 py-4 flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 min-w-0">
            <div className="font-medium text-gray-200 truncate">{user?.username}</div>
            <div className="truncate">{user?.role}</div>
          </div>
          <svg
            className={`ml-auto w-3.5 h-3.5 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180 text-slate-300' : 'text-slate-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>

        {/* Dropdown */}
        <div
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
