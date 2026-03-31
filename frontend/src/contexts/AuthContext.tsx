import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api'

interface AuthUser {
  user_id: number
  username: string
  full_name?: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  can: (minRole: string) => boolean
}

const ROLE_LEVEL: Record<string, number> = {
  super_admin: 4,
  finance_manager: 3,
  finance_staff: 2,
  view_only: 1,
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password)
    localStorage.setItem('token', data.access_token)
    const u: AuthUser = { user_id: data.user_id, username: data.username, full_name: data.full_name, role: data.role }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const can = (minRole: string) => {
    if (!user) return false
    return (ROLE_LEVEL[user.role] || 0) >= (ROLE_LEVEL[minRole] || 0)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, can }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
