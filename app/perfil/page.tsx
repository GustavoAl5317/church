"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { changeOwnPassword, MIN_PASSWORD_LENGTH } from "@/lib/services/users"
import { roleDescriptions, roleLabels } from "@/lib/constants"
import { formatDate, formatDateTime } from "@/lib/utils/format"

export default function PerfilPage() {
  const { user } = useAuth()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError("")

    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }
    if (next !== confirm) {
      setError("A confirmação não confere com a nova senha.")
      return
    }

    setIsSaving(true)
    try {
      await changeOwnPassword(user.id, current, next)
      setCurrent("")
      setNext("")
      setConfirm("")
      toast.success("Senha alterada com sucesso")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar a senha")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Meu Perfil" }]}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">Seus dados de acesso</p>
        </div>

        {user && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Papel</p>
                <Badge variant="secondary" className="mt-1">
                  {roleLabels[user.role]}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">{roleDescriptions[user.role]}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-muted-foreground">Usuário desde</p>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
                {user.lastLogin && (
                  <div>
                    <p className="text-muted-foreground">Último acesso</p>
                    <p>{formatDateTime(user.lastLogin)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Trocar senha</CardTitle>
            <CardDescription>Se você recebeu uma senha provisória, troque-a aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="current">Senha atual</Label>
                <Input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="next">Nova senha</Label>
                  <Input
                    id="next"
                    type="password"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar nova senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar nova senha
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
