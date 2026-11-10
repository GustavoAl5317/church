"use client"

import { useContext } from "react"
import { AuthContext } from "@/components/auth/auth-provider"
import { can, type Action, type Module } from "@/lib/permissions"

/**
 * Acesso ao usuário logado e às permissões dele.
 * Precisa estar dentro do <AuthProvider> (já incluído no layout raiz).
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  }

  return {
    ...context,
    isAuthenticated: context.user !== null,
    can: (module: Module, action: Action = "view") => can(context.user?.role, module, action),
  }
}
