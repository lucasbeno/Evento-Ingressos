import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import type { AuthResponse, UserRole } from '../types'

interface AuthUser {
  token: string
  userId: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'auth_user'
const TOKEN_KEY = 'auth_token'

function persist(response: AuthResponse): AuthUser {
  const user: AuthUser = {
    token: response.token,
    userId: response.userId,
    name: response.name,
    email: response.email,
    role: response.role,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, user.token)
  return user
}

function restore(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => restore())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        const response = await authApi.login(email, password)
        const authUser = persist(response)
        setUser(authUser)
        return authUser
      },
      register: async (name, email, password) => {
        const response = await authApi.register(name, email, password)
        const authUser = persist(response)
        setUser(authUser)
        return authUser
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
