"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { authenticateUser, ensureDefaultAdmin } from "@/lib/services/users"
import { saveUserSession, isAuthenticated } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isInitializing, setIsInitializing] = useState(true)

  // Verifica se o usuário já está autenticado e garante que o admin padrão existe
  useEffect(() => {
    const initialize = async () => {
      // Garante que o usuário admin padrão existe
      await ensureDefaultAdmin()
      
      // Verifica se o usuário já está autenticado
      if (isAuthenticated()) {
        // Verifica se há um redirect na URL
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect') || '/dashboard'
        router.push(redirect)
      } else {
        setIsInitializing(false)
      }
    }
    
    initialize()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Autentica o usuário no banco de dados
      const user = await authenticateUser(email.trim(), password)

      if (user) {
        // Salva a sessão
        saveUserSession(user)
        
        // Verifica se há um redirect na URL
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect') || '/dashboard'
        
        // Redireciona para a página desejada
        router.push(redirect)
        router.refresh()
      } else {
        setError("Email ou senha inválidos. Verifique suas credenciais e tente novamente.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Erro ao autenticar:", err)
      setError(
        err instanceof Error 
          ? err.message 
          : "Erro ao fazer login. Por favor, tente novamente."
      )
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
            LC
          </div>
          <CardTitle className="text-2xl">Livre Sou em Cristo</CardTitle>
          <CardDescription>Sistema de Gestão</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Usuário padrão:</p>
                <p className="font-mono text-xs">admin@livresouemcristo.com.br</p>
                <p className="font-mono text-xs">admin123</p>
              </div>
              <Link href="/recuperar-senha" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>
          <CardFooter>
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
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
