import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../context/AuthContext'

export function AppLayout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-slate-900 flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-300 hover:text-white p-1"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" />
          <circle cx="26" cy="16" r="2.5" fill="#7AA2FF" />
        </svg>
        <span className="text-base font-bold tracking-tight text-white">Orchestro</span>
      </header>

      {/* Overlay backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
