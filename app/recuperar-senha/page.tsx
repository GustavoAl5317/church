"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { AuthScreen } from "@/components/auth/auth-screen"
import { requestPasswordReset } from "@/lib/services/users"

/**
 * Recuperação de senha.
 * O pedido fica registrado e um administrador define uma senha provisória em Configurações.
 * A tela nunca troca a senha diretamente, para que ninguém consiga tomar a conta de outra pessoa
 * só sabendo o email dela.
 */
export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      console.error("Erro ao solicitar recuperação de senha:", err)
      setError("Não foi possível registrar o pedido. Tente novamente em instantes.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthScreen subtitle="Recuperação de senha">
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Pedido registrado</h2>
            <p className="text-sm text-muted-foreground">
              Se o email <strong>{email}</strong> estiver cadastrado, o administrador da igreja vai receber o pedido e
              definir uma senha provisória para você. Depois de entrar, troque a senha em <strong>Meu Perfil</strong>.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Informe o email da sua conta. O administrador será avisado e definirá uma senha provisória para você.
          </p>
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Solicitar nova senha"
            )}
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Link>
          </Button>
        </form>
      )}
    </AuthScreen>
  )
}
