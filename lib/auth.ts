'use client'

import type { User } from './types'
import { generateToken as generateSecureToken } from './crypto'

const USER_SESSION_KEY = 'church_user_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 dias
const REFRESH_THRESHOLD = 24 * 60 * 60 * 1000 // 1 dia antes de expirar

export interface UserSession {
  user: User
  token: string
  refreshToken: string
  expiresAt: number
  createdAt: number
  lastActivity: number
}

/**
 * Salva a sessão do usuário no localStorage com segurança aprimorada
 */
export function saveUserSession(user: User): void {
  if (typeof window === 'undefined') return

  const now = Date.now()
  const session: UserSession = {
    user,
    token: generateSecureToken(),
    refreshToken: generateSecureToken(),
    expiresAt: now + SESSION_DURATION,
    createdAt: now,
    lastActivity: now,
  }

  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Erro ao salvar sessão:', error)
  }
}

/**
 * Obtém a sessão do usuário do localStorage com validações de segurança
 */
export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null

  try {
    const sessionStr = localStorage.getItem(USER_SESSION_KEY)
    if (!sessionStr) return null

    const session: UserSession = JSON.parse(sessionStr)

    // Valida estrutura da sessão
    if (!session.user || !session.token || !session.expiresAt) {
      clearUserSession()
      return null
    }

    // Verifica se a sessão expirou
    if (session.expiresAt < Date.now()) {
      clearUserSession()
      return null
    }

    // Atualiza última atividade
    session.lastActivity = Date.now()
    
    // Se está próximo de expirar, renova automaticamente
    if (session.expiresAt - Date.now() < REFRESH_THRESHOLD) {
      session.expiresAt = Date.now() + SESSION_DURATION
      session.token = generateSecureToken()
      try {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
      } catch (error) {
        console.error('Erro ao renovar sessão:', error)
      }
    }

    return session
  } catch (error) {
    console.error('Erro ao ler sessão:', error)
    clearUserSession()
    return null
  }
}

/**
 * Obtém o usuário atual da sessão
 */
export function getCurrentUser(): User | null {
  const session = getUserSession()
  return session?.user || null
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

/**
 * Verifica se a sessão está ativa e válida
 */
export function isSessionValid(): boolean {
  const session = getUserSession()
  if (!session) return false

  // Verifica se a sessão não expirou
  if (session.expiresAt < Date.now()) {
    clearUserSession()
    return false
  }

  // Verifica se a sessão não está muito antiga (máximo 30 dias)
  const maxAge = 30 * 24 * 60 * 60 * 1000
  if (Date.now() - session.createdAt > maxAge) {
    clearUserSession()
    return false
  }

  return true
}

/**
 * Atualiza a última atividade da sessão
 */
export function updateSessionActivity(): void {
  const session = getUserSession()
  if (session) {
    session.lastActivity = Date.now()
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Erro ao atualizar atividade da sessão:', error)
    }
  }
}

/**
 * Limpa a sessão do usuário
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USER_SESSION_KEY)
  } catch (error) {
    console.error('Erro ao limpar sessão:', error)
  }
}

/**
 * Renova o token da sessão
 */
export function refreshSession(): boolean {
  const session = getUserSession()
  if (!session) return false

  session.token = generateSecureToken()
  session.expiresAt = Date.now() + SESSION_DURATION
  session.lastActivity = Date.now()

  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session))
    return true
  } catch (error) {
    console.error('Erro ao renovar sessão:', error)
    return false
  }
}
