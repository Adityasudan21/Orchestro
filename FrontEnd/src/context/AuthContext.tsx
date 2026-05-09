import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { setCredentials, clearCredentials } from '../api/axios'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('orchestro_user')
    return stored ? (JSON.parse(stored) as User) : null
  })

  const login = useCallback((username: string, password: string, userData: User) => {
    setCredentials(username, password)
    setUser(userData)
    sessionStorage.setItem('orchestro_user', JSON.stringify(userData))
    const creds = btoa(`${username}:${password}`)
    sessionStorage.setItem('orchestro_creds', creds)
  }, [])

  const logout = useCallback(() => {
    clearCredentials()
    setUser(null)
    sessionStorage.removeItem('orchestro_user')
    sessionStorage.removeItem('orchestro_creds')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
