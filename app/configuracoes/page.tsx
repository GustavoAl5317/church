"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, KeyRound, Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { UserDialog, type UserFormData } from "@/components/settings/user-dialog"
import { useAuth } from "@/hooks/use-auth"
import {
  closePasswordReset,
  createUser,
  deleteUser,
  getPendingPasswordResets,
  getUsers,
  resolvePasswordReset,
  setUserPassword,
  updateUser,
} from "@/lib/services/users"
import { generateTemporaryPassword } from "@/lib/crypto"
import { roleDescriptions, roleLabels } from "@/lib/constants"
import { ALL_ROLES, moduleLabels, permissions, type Module } from "@/lib/permissions"
import type { PasswordResetRequest, User } from "@/lib/types"
import { formatDate, formatDateTime } from "@/lib/utils/format"

const MATRIX_MODULES = (Object.keys(permissions) as Module[]).filter((m) => m !== "perfil")

export default function ConfiguracoesPage() {
  const { user: currentUser, refreshUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [resets, setResets] = useState<PasswordResetRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [toDelete, setToDelete] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState<{ user: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [workingResetId, setWorkingResetId] = useState<string | null>(null)

  const load = async () => {
    try {
      const [usersList, resetsList] = await Promise.all([
        getUsers(),
        getPendingPasswordResets().catch((error) => {
          console.error("Erro ao carregar pedidos de senha:", error)
          return [] as PasswordResetRequest[]
        }),
      ])
      setUsers(usersList)
      setResets(resetsList)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.includes(term))
  }, [users, search])

  const activeAdmins = users.filter((u) => u.role === "admin" && u.isActive)

  const handleSave = async (data: UserFormData) => {
    if (editing) {
      const losingAdmin =
        editing.role === "admin" && editing.isActive && (data.role !== "admin" || !data.isActive)
      if (losingAdmin && activeAdmins.length <= 1) {
        throw new Error("É preciso manter pelo menos um administrador ativo.")
      }
      const updated = await updateUser(editing.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      })
      if (data.password) await setUserPassword(editing.id, data.password)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      if (updated.id === currentUser?.id) await refreshUser()
      toast.success("Usuário atualizado")
    } else {
      const created = await createUser(
        { name: data.name, email: data.email, role: data.role, isActive: data.isActive },
        data.password,
      )
      setUsers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success("Usuário criado")
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteUser(toDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id))
      toast.success("Usuário removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover usuário")
    }
  }

  const approveReset = async (request: PasswordResetRequest) => {
    setWorkingResetId(request.id)
    try {
      const password = generateTemporaryPassword()
      await resolvePasswordReset(request, password)
      setResets((prev) => prev.filter((r) => r.id !== request.id))
      setCopied(false)
      setTempPassword({ user: `${request.userName} (${request.userEmail})`, password })
    } catch (error) {
      console.error("Erro ao definir senha provisória:", error)
      toast.error("Erro ao definir senha provisória")
    } finally {
      setWorkingResetId(null)
    }
  }

  const rejectReset = async (request: PasswordResetRequest) => {
    setWorkingResetId(request.id)
    try {
      await closePasswordReset(request.id, "recusado")
      setResets((prev) => prev.filter((r) => r.id !== request.id))
      toast.success("Pedido recusado")
    } catch (error) {
      console.error("Erro ao recusar pedido:", error)
      toast.error("Erro ao recusar pedido")
    } finally {
      setWorkingResetId(null)
    }
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword.password)
      setCopied(true)
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie a senha manualmente.")
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Configurações" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie usuários e papéis de acesso</p>
        </div>

        <Tabs defaultValue="usuarios" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="papeis">Papéis & Permissões</TabsTrigger>
            <TabsTrigger value="senhas" className="gap-2">
              Recuperação de senha
              {resets.length > 0 && <Badge variant="destructive">{resets.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>

            <Card className="py-0">
              <CardContent className="px-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de adesão</TableHead>
                        <TableHead className="pr-6 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="pl-6 font-medium">
                            {u.name}
                            {u.id === currentUser?.id && <span className="ml-1 text-xs text-muted-foreground">(você)</span>}
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{roleLabels[u.role]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                u.isActive
                                  ? "border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "border-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                              }
                            >
                              {u.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(u.createdAt)}</TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto px-1"
                              onClick={() => {
                                setEditing(u)
                                setDialogOpen(true)
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto px-1 text-destructive"
                              disabled={u.id === currentUser?.id}
                              onClick={() => setToDelete(u)}
                            >
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">Total de usuários: {users.length}</p>
          </TabsContent>

          <TabsContent value="papeis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ALL_ROLES.map((role) => (
                <Card key={role} className="gap-2">
                  <CardHeader>
                    <CardTitle>{roleLabels[role]}</CardTitle>
                    <CardDescription>{roleDescriptions[role]}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {users.filter((u) => u.role === role).length} usuário(s)
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Matriz de permissões</CardTitle>
                <CardDescription>
                  &quot;Gerenciar&quot; permite criar, editar e remover. &quot;Ver&quot; permite apenas consultar.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      {ALL_ROLES.map((role) => (
                        <TableHead key={role} className="text-center">
                          {roleLabels[role]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MATRIX_MODULES.map((module) => (
                      <TableRow key={module}>
                        <TableCell className="font-medium">{moduleLabels[module]}</TableCell>
                        {ALL_ROLES.map((role) => {
                          const manage = permissions[module].manage.includes(role)
                          const view = permissions[module].view.includes(role)
                          return (
                            <TableCell key={role} className="text-center text-sm">
                              {manage ? (
                                <span className="font-medium text-emerald-600">Gerenciar</span>
                              ) : view ? (
                                <span className="text-blue-600">Ver</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="senhas">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos de recuperação de senha</CardTitle>
                <CardDescription>
                  Confirme a identidade da pessoa antes de liberar. O sistema gera uma senha provisória para você
                  repassar; ela deve trocá-la em Meu Perfil depois de entrar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resets.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground">Nenhum pedido pendente.</p>
                ) : (
                  <div className="space-y-3">
                    {resets.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{request.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.userEmail} · pedido em {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            disabled={workingResetId === request.id}
                            onClick={() => rejectReset(request)}
                          >
                            Recusar
                          </Button>
                          <Button disabled={workingResetId === request.id} onClick={() => approveReset(request)}>
                            {workingResetId === request.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <KeyRound className="mr-2 h-4 w-4" />
                            )}
                            Gerar senha provisória
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        isSelf={!!editing && editing.id === currentUser?.id}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remover usuário?"
        description={
          <>
            <strong>{toDelete?.name}</strong> perderá o acesso ao sistema. Se preferir manter o histórico, marque o
            usuário como inativo.
          </>
        }
        onConfirm={handleDelete}
      />

      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha provisória criada</DialogTitle>
            <DialogDescription>
              Repasse esta senha para {tempPassword?.user}. Ela não será mostrada de novo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-lg">{tempPassword?.password}</code>
            <Button variant="outline" size="icon" onClick={copyPassword}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copiar</span>
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>Pronto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
