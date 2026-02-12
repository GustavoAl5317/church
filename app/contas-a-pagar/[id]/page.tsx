"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Building2,
  Tag,
  Repeat,
  Loader2,
} from "lucide-react"
import { getBillPayable, deleteBillPayable } from "@/lib/services/bills"
import type { BillPayable } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { format, differenceInDays, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { paymentMethods } from "@/lib/constants"

export default function DetalhesDespesaPage() {
  const params = useParams()
  const router = useRouter()
  const billId = params.id as string
  const [bill, setBill] = useState<BillPayable | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadBill()
  }, [billId])

  const loadBill = async () => {
    try {
      setIsLoading(true)
      const data = await getBillPayable(billId)
      setBill(data)
    } catch (error) {
      console.error("Error loading bill:", error)
      toast.error("Erro ao carregar despesa")
      router.push("/contas-a-pagar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bill) return

    try {
      setIsDeleting(true)
      await deleteBillPayable(bill.id)
      toast.success("Despesa excluída com sucesso!")
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboard:refresh'))
      }
      
      router.push("/contas-a-pagar")
    } catch (error) {
      console.error("Error deleting bill:", error)
      toast.error("Erro ao excluir despesa")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const getStatusInfo = (bill: BillPayable) => {
    if (bill.status === "pago") {
      return { label: "Pago", variant: "default" as const, icon: CheckCircle, color: "text-emerald-600" }
    }
    if (bill.status === "cancelado") {
      return { label: "Cancelado", variant: "secondary" as const, icon: null, color: "text-muted-foreground" }
    }
    if (bill.status === "atrasado" || isPast(bill.dueDate)) {
      return { label: "Atrasada", variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" }
    }
    const daysUntil = differenceInDays(bill.dueDate, new Date())
    if (daysUntil <= 3) {
      return { label: `Vence em ${daysUntil}d`, variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" }
    }
    if (daysUntil <= 7) {
      return { label: `Vence em ${daysUntil}d`, variant: "outline" as const, icon: Clock, color: "text-amber-600" }
    }
    return { label: "Pendente", variant: "outline" as const, icon: Clock, color: "text-muted-foreground" }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Detalhes" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!bill) {
    return (
      <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Detalhes" }]}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Despesa não encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/contas-a-pagar">Voltar</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  const statusInfo = getStatusInfo(bill)
  const paymentMethod = paymentMethods.find(m => m.value === bill.paymentMethod)

  return (
    <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Detalhes" }]}>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/contas-a-pagar">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{bill.description}</h1>
              <p className="text-muted-foreground">Detalhes da despesa</p>
            </div>
          </div>
          <div className="flex gap-2">
            {bill.status !== "pago" && bill.status !== "cancelado" && (
              <Button variant="outline" asChild>
                <Link href={`/contas-a-pagar/${bill.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status</CardTitle>
              <Badge variant={statusInfo.variant} className="gap-1">
                {statusInfo.icon && <statusInfo.icon className="h-4 w-4" />}
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-2xl font-bold">{formatCurrency(bill.amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="text-lg font-semibold">{formatDate(bill.dueDate)}</p>
                  {bill.status !== "pago" && (
                    <p className="text-xs text-muted-foreground">
                      {differenceInDays(bill.dueDate, new Date()) >= 0
                        ? `${differenceInDays(bill.dueDate, new Date())} dia(s) restante(s)`
                        : `${Math.abs(differenceInDays(bill.dueDate, new Date()))} dia(s) de atraso`}
                    </p>
                  )}
                </div>
              </div>
              {bill.paidDate && (
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Pagamento</p>
                    <p className="text-lg font-semibold">{formatDate(bill.paidDate)}</p>
                  {paymentMethod && (
                    <p className="text-xs text-muted-foreground">{paymentMethod.label}</p>
                  )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Detalhadas */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Categoria</span>
                </div>
                <Badge variant="secondary">{bill.category}</Badge>
              </div>
              <Separator />
              {bill.supplierName && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Fornecedor</span>
                    </div>
                    <span className="font-medium">{bill.supplierName}</span>
                  </div>
                  <Separator />
                </>
              )}
              {bill.recurrence && bill.recurrence !== "unica" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Repeat className="h-4 w-4" />
                      <span>Recorrência</span>
                    </div>
                    <Badge variant="outline">
                      {bill.recurrence === "mensal" ? "Mensal" : 
                       bill.recurrence === "semanal" ? "Semanal" : 
                       bill.recurrence === "anual" ? "Anual" : ""}
                    </Badge>
                  </div>
                  <Separator />
                </>
              )}
              {bill.costCenter && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Centro de Custo</span>
                    </div>
                    <span className="font-medium">{bill.costCenter}</span>
                  </div>
                  <Separator />
                </>
              )}
              {bill.paymentMethod && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Forma de Pagamento</span>
                  </div>
                  <span className="font-medium">{paymentMethod?.label || bill.paymentMethod}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">{format(bill.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última atualização</span>
                <span className="font-medium">{format(bill.updatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {bill.paidDate && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pago em</span>
                    <span className="font-medium text-emerald-600">{format(bill.paidDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        {bill.observations && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{bill.observations}</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Despesa</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a despesa "{bill.description}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vencimento</p>
                  <p className="font-semibold">{formatDate(bill.dueDate)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
