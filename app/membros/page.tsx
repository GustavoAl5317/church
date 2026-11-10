"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Upload, Users, UserCheck, UserX, UserPlus, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { deleteMember, getMembers } from "@/lib/services/members"
import { memberRoleLabels, memberStatusBadgeClass, memberStatusLabels } from "@/lib/constants"
import type { Member } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export default function MembrosPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [toDelete, setToDelete] = useState<Member | null>(null)

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch((error) => {
        console.error("Erro ao carregar membros:", error)
        toast.error("Erro ao carregar membros")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = normalize(search.trim())
    return members.filter((m) => {
      if (statusFilter !== "todos" && m.status !== statusFilter) return false
      if (!term) return true
      return [m.name, m.email ?? "", m.phone ?? ""].some((field) => normalize(field).includes(term))
    })
  }, [members, search, statusFilter])

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteMember(toDelete.id)
      setMembers((prev) => prev.filter((m) => m.id !== toDelete.id))
      toast.success("Membro removido")
    } catch (error) {
      console.error("Erro ao remover membro:", error)
      toast.error("Erro ao remover membro")
    }
  }

  const count = (status: Member["status"]) => members.filter((m) => m.status === status).length
  const percent = (value: number) => (members.length > 0 ? Math.round((value / members.length) * 100) : 0)

  const summary = [
    { label: "Total", value: members.length, hint: "membros cadastrados", icon: Users, color: "" },
    { label: "Ativos", value: count("ativo"), hint: `${percent(count("ativo"))}% do total`, icon: UserCheck, color: "text-emerald-600" },
    { label: "Inativos", value: count("inativo"), hint: `${percent(count("inativo"))}% do total`, icon: UserX, color: "text-muted-foreground" },
    { label: "Visitantes", value: count("visitante"), hint: "aguardando integração", icon: UserPlus, color: "text-amber-600" },
  ]

  return (
    <AppLayout breadcrumbs={[{ label: "Membros" }]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Membros</h1>
            <p className="text-muted-foreground">
              Total: {filtered.length} de {members.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/membros/importar">
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/membros/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Membro
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {summary.map((item) => (
            <Card key={item.label} className="gap-2 py-4">
              <CardHeader className="flex flex-row items-center justify-between px-4">
                <span className={`text-sm font-medium ${item.color || "text-muted-foreground"}`}>{item.label}</span>
                <item.icon className={`h-4 w-4 ${item.color || "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent className="px-4">
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(memberStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {members.length === 0 ? "Nenhum membro cadastrado ainda." : "Nenhum membro encontrado com esses filtros."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((member) => (
              <Card key={member.id} className="gap-4">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant="outline" className={`border-0 ${memberStatusBadgeClass[member.status]}`}>
                      {memberStatusLabels[member.status]}
                    </Badge>
                    <Badge variant="secondary">{memberRoleLabels[member.memberRole]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Link href={`/membros/${member.id}`} className="font-semibold hover:underline">
                      {member.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{member.email || "Sem email"}</p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Tel: {member.phone || "-"}</p>
                    <p>Membro desde: {formatDate(member.entryDate)}</p>
                    <p>Batizado: {member.baptized ? "Sim" : "Não"}</p>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 border-t pt-4">
                  <Button variant="ghost" className="text-primary" asChild>
                    <Link href={`/membros/${member.id}/editar`}>Editar</Link>
                  </Button>
                  <Button variant="ghost" className="text-destructive" onClick={() => setToDelete(member)}>
                    Remover
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remover membro?"
        description={
          <>
            O cadastro de <strong>{toDelete?.name}</strong> será apagado. Esta ação não pode ser desfeita.
          </>
        }
        onConfirm={handleDelete}
      />
    </AppLayout>
  )
}
