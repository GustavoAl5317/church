"use client"

import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import {
  clearUserSession,
  getCurrentUser,
  isSessionValid,
  saveUserSession,
  updateSessionActivity,
  updateSessionUser,
} from "@/lib/auth"
import { getUserById } from "@/lib/services/users"

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const PUBLIC_PATHS = ["/login", "/recuperar-senha"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearUserSession()
    setUser(null)
    router.push("/login")
  }, [router])

  const login = useCallback((loggedUser: User) => {
    saveUserSession(loggedUser)
    setUser(loggedUser)
  }, [])

  // Recarrega o usuário do banco: pega mudanças de papel e desloga quem foi desativado ou removido
  const refreshUser = useCallback(async () => {
    const sessionUser = isSessionValid() ? getCurrentUser() : null
    if (!sessionUser) {
      setUser(null)
      return
    }

    try {
      const fresh = await getUserById(sessionUser.id)
      if (!fresh || !fresh.isActive) {
        clearUserSession()
        setUser(null)
        return
      }
      updateSessionUser(fresh)
      setUser(fresh)
    } catch (error) {
      // Sem conexão com o banco: mantém a sessão local
      console.error("Erro ao atualizar dados do usuário:", error)
      setUser({ ...sessionUser, isActive: sessionUser.isActive !== false })
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  // Mantém a sessão viva enquanto o usuário usa o sistema e encerra quando expira
  useEffect(() => {
    if (!user) return

    const check = () => {
      if (!isSessionValid()) {
        setUser(null)
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        }
      } else {
        updateSessionActivity()
      }
    }

    const interval = setInterval(check, 5 * 60 * 1000)
    window.addEventListener("focus", check)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", check)
    }
  }, [user, pathname, router])

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshUser }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
