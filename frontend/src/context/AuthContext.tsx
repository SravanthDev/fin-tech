import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { apiRequest, clearToken, getToken, setToken } from "@/lib/api"
import type { User } from "@/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface TokenResponse {
  accessToken: string
  user: User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    })
    setToken(res.accessToken)
    setUser(res.user)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiRequest<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    })
    setToken(res.accessToken)
    setUser(res.user)
  }, [])

  // TEMP: login screen is commented out (see App.tsx) while the app is under active
  // development. This silently signs in (or creates) a fixed dev account so API
  // calls still have a valid session. Remove alongside re-enabling /login.
  const devAutoLogin = useCallback(async () => {
    const DEV_EMAIL = "dev@letstalkmoney.app"
    const DEV_PASSWORD = "devpassword123"
    try {
      await login(DEV_EMAIL, DEV_PASSWORD)
    } catch {
      await register("Sreeram", DEV_EMAIL, DEV_PASSWORD)
    }
  }, [login, register])

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      await devAutoLogin()
      return
    }
    try {
      const me = await apiRequest<User>("/api/auth/me")
      setUser(me)
    } catch {
      clearToken()
      await devAutoLogin()
    }
  }, [devAutoLogin])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
