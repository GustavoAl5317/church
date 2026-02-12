'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isSessionValid, updateSessionActivity } from '@/lib/auth'

/**
 * Componente que monitora a sessão do usuário e atualiza atividade
 * Deve ser usado no layout principal da aplicação
 */
export function SessionMonitor() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Ignora na página de login
    if (pathname === '/login' || pathname === '/recuperar-senha') {
      return
    }

    // Verifica se a sessão é válida
    if (!isSessionValid()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // Atualiza atividade da sessão
    updateSessionActivity()

    // Atualiza atividade a cada 5 minutos
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      } else {
        updateSessionActivity()
      }
    }, 5 * 60 * 1000)

    // Atualiza atividade quando a janela recebe foco
    const handleFocus = () => {
      if (!isSessionValid()) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      } else {
        updateSessionActivity()
      }
    }

    // Atualiza atividade em interações do usuário
    const handleActivity = () => {
      updateSessionActivity()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('mousedown', handleActivity)
    document.addEventListener('keydown', handleActivity)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('mousedown', handleActivity)
      document.removeEventListener('keydown', handleActivity)
    }
  }, [router, pathname])

  return null
}
