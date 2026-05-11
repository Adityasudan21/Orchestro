import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setCredentials, clearCredentials, restoreCredentials } from '../api/axios'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string, user: User) => void
  logout: () => void
  updateCredentials: (newPassword: string) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('orchestro_user')
    const creds = sessionStorage.getItem('orchestro_creds')
    if (stored && creds) restoreCredentials(creds)
    return stored ? (JSON.parse(stored) as User) : null
  })

  const login = useCallback((username: string, password: string, userData: User) => {
    // Clear any cached data from a previous session before setting the new user.
    queryClient.clear()
    setCredentials(username, password)
    setUser(userData)
    sessionStorage.setItem('orchestro_user', JSON.stringify(userData))
    const creds = btoa(`${username}:${password}`)
    sessionStorage.setItem('orchestro_creds', creds)
  }, [queryClient])

  const logout = useCallback(() => {
    clearCredentials()
    setUser(null)
    sessionStorage.removeItem('orchestro_user')
    sessionStorage.removeItem('orchestro_creds')
    queryClient.clear()
  }, [queryClient])

  const updateCredentials = useCallback((newPassword: string) => {
    const username = JSON.parse(sessionStorage.getItem('orchestro_user') || '{}')?.username
    if (!username) return
    setCredentials(username, newPassword)
    sessionStorage.setItem('orchestro_creds', btoa(`${username}:${newPassword}`))
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, updateCredentials }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
