"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { roleLabels } from "@/lib/constants"
import { ALL_ROLES } from "@/lib/permissions"
import { MIN_PASSWORD_LENGTH } from "@/lib/services/users"
import type { User, UserRole } from "@/lib/types"

export interface UserFormData {
  name: string
  email: string
  role: UserRole
  isActive: boolean
  password: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: User | null
  isSelf?: boolean
  onSubmit: (data: UserFormData) => Promise<void>
}

export function UserDialog({ open, onOpenChange, initial, isSelf, onSubmit }: UserDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("membro")
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? "")
    setEmail(initial?.email ?? "")
    setRole(initial?.role ?? "membro")
    setIsActive(initial?.isActive ?? true)
    setPassword("")
    setError("")
  }, [open, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!initial && password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }
    if (initial && password && password.length < MIN_PASSWORD_LENGTH) {
      setError(`A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({ name, email, role, isActive, password })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuário")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              {initial ? "Altere os dados de acesso" : "Crie um acesso ao sistema"}
            </DialogDescription>
          </DialogHeader>

          {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="user-name">Nome</Label>
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={isSelf}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && <p className="text-xs text-muted-foreground">Você não pode mudar o seu próprio papel.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">{initial ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              placeholder={initial ? "Deixe em branco para manter a atual" : `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="user-active">Ativo</Label>
              <p className="text-xs text-muted-foreground">Usuários inativos não conseguem entrar</p>
            </div>
            <Switch id="user-active" checked={isActive} onCheckedChange={setIsActive} disabled={isSelf} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
