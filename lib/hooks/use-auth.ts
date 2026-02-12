'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isAuthenticated, updateSessionActivity, isSessionValid } from '@/lib/auth'
import type { User } from '@/lib/types'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      if (!isSessionValid()) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const currentUser = getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)

      // Atualiza atividade da sessão periodicamente
      const interval = setInterval(() => {
        updateSessionActivity()
      }, 5 * 60 * 1000) // A cada 5 minutos

      return () => clearInterval(interval)
    }

    checkAuth()

    // Verifica autenticação quando a janela recebe foco
    const handleFocus = () => {
      if (!isSessionValid()) {
        router.push('/login')
      } else {
        updateSessionActivity()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [router])

  return {
    user,
    isAuthenticated: isAuthenticated(),
    isLoading,
  }
}
