"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { AuthScreen } from "@/components/auth/auth-screen"
import { authenticateUser, ensureDefaultAdmin } from "@/lib/services/users"
import { useAuth } from "@/hooks/use-auth"

/** Aceita só caminhos internos, para o parâmetro ?redirect= não levar a outro site */
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard"
  return value
}

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    ensureDefaultAdmin()
  }, [])

  // Quem já está logado vai direto para o sistema
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace(safeRedirect(new URLSearchParams(window.location.search).get("redirect")))
    }
  }, [isAuthLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const authenticated = await authenticateUser(email.trim(), password)
      if (!authenticated) {
        setError("Email ou senha inválidos. Verifique suas credenciais e tente novamente.")
        return
      }
      login(authenticated)
      router.replace(safeRedirect(new URLSearchParams(window.location.search).get("redirect")))
    } catch (err) {
      console.error("Erro ao autenticar:", err)
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AuthScreen subtitle="Gerencie sua comunidade">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
            </Button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
        <div className="text-center">
          <Link href="/recuperar-senha" className="text-sm text-primary hover:underline">
            Esqueceu sua senha?
          </Link>
        </div>
      </form>
    </AuthScreen>
  )
}
