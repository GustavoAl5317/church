"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TitheDialog } from "@/components/tithes/tithe-dialog"
import { createTithe, deleteTithe, getTithes, updateTithe, type TitheInput } from "@/lib/services/tithes"
import { getMembers } from "@/lib/services/members"
import { paymentMethods, titheStatusLabels, titheTypeLabels } from "@/lib/constants"
import type { Member, Tithe } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"

const PERIODS = {
  tudo: "Todo o período",
  mes: "Este mês",
  mes_passado: "Mês passado",
  ano: "Este ano",
} as const

function inPeriod(date: Date, period: keyof typeof PERIODS) {
  const now = new Date()
  if (period === "mes") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  if (period === "mes_passado") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return date.getMonth() === last.getMonth() && date.getFullYear() === last.getFullYear()
  }
  if (period === "ano") return date.getFullYear() === now.getFullYear()
  return true
}

const methodLabel = Object.fromEntries(paymentMethods.map((m) => [m.value, m.label]))

export default function DizimosPage() {
  const [tithes, setTithes] = useState<Tithe[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [period, setPeriod] = useState<keyof typeof PERIODS>("tudo")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tithe | null>(null)
  const [toDelete, setToDelete] = useState<Tithe | null>(null)

  useEffect(() => {
    Promise.all([getTithes(), getMembers().catch(() => [] as Member[])])
      .then(([tithesList, membersList]) => {
        setTithes(tithesList)
        setMembers(membersList)
      })
      .catch((error) => {
        console.error("Erro ao carregar dízimos:", error)
        toast.error("Erro ao carregar dízimos e ofertas")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const inPeriodList = useMemo(() => tithes.filter((t) => inPeriod(t.date, period)), [tithes, period])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return inPeriodList.filter((t) => {
      if (typeFilter !== "todos" && t.type !== typeFilter) return false
      if (statusFilter !== "todos" && t.status !== statusFilter) return false
      return !term || t.memberName.toLowerCase().includes(term)
    })
  }, [inPeriodList, search, typeFilter, statusFilter])

  // Os totais consideram só valores confirmados do período escolhido
  const confirmed = inPeriodList.filter((t) => t.status === "confirmado")
  const sum = (list: Tithe[]) => list.reduce((acc, t) => acc + t.amount, 0)
  const dizimos = confirmed.filter((t) => t.type === "dizimo")
  const ofertas = confirmed.filter((t) => t.type === "oferta")

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (tithe: Tithe) => {
    setEditing(tithe)
    setDialogOpen(true)
  }

  const handleSave = async (data: TitheInput) => {
    try {
      if (editing) {
        const updated = await updateTithe(editing.id, data)
        setTithes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        toast.success("Registro atualizado")
      } else {
        const created = await createTithe(data)
        setTithes((prev) => [created, ...prev].sort((a, b) => +b.date - +a.date))
        toast.success("Registro salvo")
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar registro:", error)
      toast.error("Erro ao salvar registro")
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteTithe(toDelete.id)
      setTithes((prev) => prev.filter((t) => t.id !== toDelete.id))
      toast.success("Registro removido")
    } catch (error) {
      console.error("Erro ao remover registro:", error)
      toast.error("Erro ao remover registro")
    }
  }

  const cards = [
    { label: "Total", value: sum(confirmed), count: confirmed.length, className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: "Dízimos", value: sum(dizimos), count: dizimos.length, className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300" },
    { label: "Ofertas", value: sum(ofertas), count: ofertas.length, className: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300" },
  ]

  return (
    <AppLayout breadcrumbs={[{ label: "Dízimos e Ofertas" }]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dízimos e Ofertas</h1>
            <p className="text-muted-foreground">Total de registros: {filtered.length}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as keyof typeof PERIODS)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-xl border p-5 ${card.className}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(card.value)}</p>
              <p className="mt-1 text-xs opacity-80">{card.count} registro(s) confirmado(s)</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(titheTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(titheStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="py-0">
          <CardContent className="px-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                {tithes.length === 0 ? "Nenhum dízimo ou oferta registrado ainda." : "Nenhum registro com esses filtros."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Membro</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tithe) => (
                    <TableRow key={tithe.id}>
                      <TableCell className="pl-6 font-medium">{tithe.memberName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tithe.type === "dizimo"
                              ? "border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                          }
                        >
                          {titheTypeLabels[tithe.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(tithe.amount)}</TableCell>
                      <TableCell>{formatDate(tithe.date)}</TableCell>
                      <TableCell>{methodLabel[tithe.paymentMethod]}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tithe.status === "confirmado"
                              ? "border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }
                        >
                          {titheStatusLabels[tithe.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button variant="link" size="sm" className="h-auto px-1" onClick={() => openEdit(tithe)}>
                          Editar
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-1 text-destructive"
                          onClick={() => setToDelete(tithe)}
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
      </div>

      <TitheDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        initial={editing}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remover registro?"
        description={
          <>
            O registro de {toDelete && titheTypeLabels[toDelete.type].toLowerCase()} de{" "}
            <strong>{toDelete?.memberName}</strong> ({toDelete && formatCurrency(toDelete.amount)}) será apagado.
          </>
        }
        onConfirm={handleDelete}
      />
    </AppLayout>
  )
}
