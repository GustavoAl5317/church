"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  CalendarIcon,
  Loader2,
  Upload,
  Repeat,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  X,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { format, differenceInDays, isPast, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { paymentMethods } from "@/lib/constants"
import { getBillsPayable, updateBillPayable, generateRecurringBills, deleteBillPayable } from "@/lib/services/bills"
import { getBillCategories } from "@/lib/services/bill-categories"
import { getSuppliers } from "@/lib/services/suppliers"
import { getCashBoxes, getCashTransactions } from "@/lib/services/cash"
import type { BillPayable } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

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
    return { label: `Vence em ${daysUntil}d`, variant: "destructive" as const, icon: AlertTriangle, color: "text-red-600" }
  }
  if (daysUntil <= 7) {
    return { label: `Vence em ${daysUntil}d`, variant: "outline" as const, icon: Clock, color: "text-amber-600" }
  }
  return { label: "Pendente", variant: "outline" as const, icon: Clock, color: "text-muted-foreground" }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

export default function ContasAPagarPage() {
  const [bills, setBills] = useState<BillPayable[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthBalance, setMonthBalance] = useState<{ income: number; expense: number; balance: number } | null>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<BillPayable | null>(null)
  const [payDate, setPayDate] = useState<Date>(new Date())
  const [payMethod, setPayMethod] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<BillPayable | null>(null)
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [billsData, categoriesData, suppliersData] = await Promise.all([
        getBillsPayable(),
        getBillCategories(),
        getSuppliers(),
      ])
      setBills(billsData)
      setCategories(categoriesData.map(c => ({ id: c.id, name: c.name })))
      setSuppliers(suppliersData.map(s => ({ id: s.id, name: s.name })))
      
      // Calcular saldo do mês (entradas - despesas)
      try {
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        const cashBoxes = await getCashBoxes()
        const generalCashBox = cashBoxes.find((c) => c.type === 'geral')
        
        if (generalCashBox) {
          const transactions = await getCashTransactions(
            generalCashBox.id,
            startOfDay(monthStart),
            endOfDay(monthEnd)
          )
          
          const income = transactions
            .filter((t) => t.type === 'entrada')
            .reduce((sum, t) => sum + t.amount, 0)
          
          const expense = transactions
            .filter((t) => t.type === 'saida')
            .reduce((sum, t) => sum + t.amount, 0)
          
          setMonthBalance({
            income,
            expense,
            balance: income - expense,
          })
        }
      } catch (error) {
        console.error("Error loading month balance:", error)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar contas
  const filteredBills = useMemo(() => {
    let filtered = [...bills]

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    // Filtro de categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter(b => b.category === categoryFilter)
    }

    // Filtro de fornecedor
    if (supplierFilter !== "all") {
      filtered = filtered.filter(b => b.supplierId === supplierFilter)
    }

    // Busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(b => 
        b.description.toLowerCase().includes(term) ||
        b.supplierName?.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term)
      )
    }

    // Filtro de data
    if (dateRange.from) {
      filtered = filtered.filter(b => b.dueDate >= dateRange.from!)
    }
    if (dateRange.to) {
      filtered = filtered.filter(b => b.dueDate <= dateRange.to!)
    }

    return filtered
  }, [bills, statusFilter, categoryFilter, supplierFilter, searchTerm, dateRange])

  const handlePayBill = async () => {
    if (!selectedBill || !payMethod) {
      toast.error("Selecione uma forma de pagamento")
      return
    }

    setIsSubmitting(true)
    try {
      await updateBillPayable(selectedBill.id, {
        status: "pago",
        paidDate: payDate,
        paymentMethod: payMethod as any,
      })

      try {
        const { getCashBoxes, createCashTransaction } = await import("@/lib/services/cash")
        const cashBoxes = await getCashBoxes()
        const generalCashBox = cashBoxes.find((c) => c.type === "geral")

        if (generalCashBox) {
          await createCashTransaction({
            cashBoxId: generalCashBox.id,
            type: "saida",
            category: selectedBill.category,
            description: `Pagamento: ${selectedBill.description}`,
            amount: selectedBill.amount,
            paymentMethod: payMethod as any,
            date: payDate,
            relatedBillId: selectedBill.id,
            responsibleId: "system",
            responsibleName: "Sistema",
            observations: `Pagamento da despesa: ${selectedBill.description}`,
          })
        }
      } catch (cashError) {
        console.error("Erro ao criar transação de caixa:", cashError)
      }

      toast.success("Conta marcada como paga com sucesso!")
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboard:refresh'))
        window.dispatchEvent(new CustomEvent('cash:refresh'))
      }
      
      setPayDialogOpen(false)
      setSelectedBill(null)
      await loadData()
    } catch (error) {
      console.error("Error paying bill:", error)
      toast.error("Erro ao marcar despesa como paga")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!billToDelete) return

    try {
      setIsSubmitting(true)
      await deleteBillPayable(billToDelete.id)
      toast.success("Despesa excluída com sucesso!")
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboard:refresh'))
      }
      
      setDeleteDialogOpen(false)
      setBillToDelete(null)
      await loadData()
    } catch (error) {
      console.error("Error deleting bill:", error)
      toast.error("Erro ao excluir despesa")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<BillPayable>[] = [
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => {
        const date = row.getValue("dueDate") as Date
        const daysUntil = differenceInDays(date, new Date())
        const isOverdue = isPast(date) && row.original.status !== "pago"
        
        return (
          <div className={cn("flex flex-col", isOverdue && "text-red-600 font-semibold")}>
            <span>{formatDate(date)}</span>
            {daysUntil >= 0 && daysUntil <= 7 && row.original.status !== "pago" && (
              <span className="text-xs text-amber-600">{daysUntil === 0 ? "Vence hoje!" : `${daysUntil} dia(s)`}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const bill = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{bill.description}</span>
              {bill.recurrence && bill.recurrence !== "unica" && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Repeat className="h-3 w-3" />
                  {bill.recurrence === "mensal" ? "Mensal" : 
                   bill.recurrence === "semanal" ? "Semanal" : 
                   bill.recurrence === "anual" ? "Anual" : ""}
                </Badge>
              )}
            </div>
            {bill.supplierName && (
              <span className="text-xs text-muted-foreground">{bill.supplierName}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => {
        const categoryName = row.getValue("category") as string
        return <Badge variant="secondary">{categoryName}</Badge>
      },
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        const bill = row.original
        const isOverdue = isPast(bill.dueDate) && bill.status !== "pago"
        
        return (
          <span className={cn("font-semibold", isOverdue && "text-red-600")}>
            {formatCurrency(amount)}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const bill = row.original
        const statusInfo = getStatusInfo(bill)
        return (
          <Badge variant={statusInfo.variant} className="gap-1">
            {statusInfo.icon && <statusInfo.icon className="h-3 w-3" />}
            {statusInfo.label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const bill = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/contas-a-pagar/${bill.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              {bill.status !== "pago" && bill.status !== "cancelado" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/contas-a-pagar/${bill.id}/editar`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedBill(bill)
                      setPayDialogOpen(true)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Pago
                  </DropdownMenuItem>
                </>
              )}
              {bill.recurrence && bill.recurrence !== "unica" && (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      const count = await generateRecurringBills(bill.id, 12)
                      toast.success(`${count} despesa(s) recorrente(s) gerada(s) com sucesso!`)
                      await loadData()
                    } catch (error) {
                      console.error("Erro ao gerar contas recorrentes:", error)
                      toast.error("Erro ao gerar despesas recorrentes")
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gerar Próximas Despesas
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setBillToDelete(bill)
                  setDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Cálculos de estatísticas - apenas do mês atual
  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    // Filtrar apenas despesas com vencimento no mês atual
    const monthBills = bills.filter((b) => {
      const billDate = new Date(b.dueDate)
      return (
        billDate >= monthStart &&
        billDate <= monthEnd
      )
    })
    
    const pendingBills = monthBills.filter((b) => b.status === "pendente" || b.status === "atrasado")
    const overdueBills = monthBills.filter(
      (b) => b.status === "atrasado" || (b.status === "pendente" && isPast(b.dueDate)),
    )
    const upcomingBills = pendingBills.filter((b) => {
      const days = differenceInDays(b.dueDate, new Date())
      return days >= 0 && days <= 7 && !isPast(b.dueDate)
    })
    const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0)
    const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0)
    const totalUpcoming = upcomingBills.reduce((sum, b) => sum + b.amount, 0)
    
    // Contas pagas este mês
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const paidBillsThisMonth = bills.filter((b) => {
      if (b.status !== "pago" || !b.paidDate) return false
      const paidDate = new Date(b.paidDate)
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
    })
    const totalPaidThisMonth = paidBillsThisMonth.reduce((sum, b) => sum + b.amount, 0)
    
    // Contas pagas mês anterior
    const lastMonth = subMonths(new Date(), 1)
    const paidBillsLastMonth = bills.filter((b) => {
      if (b.status !== "pago" || !b.paidDate) return false
      const paidDate = new Date(b.paidDate)
      return paidDate.getMonth() === lastMonth.getMonth() && paidDate.getFullYear() === lastMonth.getFullYear()
    })
    const totalPaidLastMonth = paidBillsLastMonth.reduce((sum, b) => sum + b.amount, 0)
    
    // Comparação com mês anterior
    const monthComparison = totalPaidLastMonth > 0 
      ? ((totalPaidThisMonth - totalPaidLastMonth) / totalPaidLastMonth) * 100 
      : 0

    // Por categoria
    const byCategory = bills.reduce((acc, bill) => {
      if (bill.status !== "pago") return acc
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount
      return acc
    }, {} as Record<string, number>)

    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // Por mês (últimos 6 meses)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i)
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthBills = bills.filter(b => {
        if (b.status !== "pago" || !b.paidDate) return false
        const paidDate = new Date(b.paidDate)
        return paidDate >= monthStart && paidDate <= monthEnd
      })
      
      monthlyData.push({
        month: format(month, "MMM/yy", { locale: ptBR }),
        valor: monthBills.reduce((sum, b) => sum + b.amount, 0),
      })
    }

    return {
      pendingBills,
      overdueBills,
      upcomingBills,
      totalPending,
      totalOverdue,
      totalUpcoming,
      paidBillsThisMonth,
      totalPaidThisMonth,
      monthComparison,
      categoryData,
      monthlyData,
    }
  }, [bills])

  // Alertas de vencimento - apenas do mês atual
  const alerts = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const alertsList: BillPayable[] = []
    
    bills.forEach(bill => {
      if (bill.status === "pago" || bill.status === "cancelado") return
      
      // Filtrar apenas despesas do mês atual
      const billDate = new Date(bill.dueDate)
      if (billDate < monthStart || billDate > monthEnd) return
      
      const daysUntil = differenceInDays(bill.dueDate, new Date())
      if (daysUntil <= 7 || isPast(bill.dueDate)) {
        alertsList.push(bill)
      }
    })
    
    return alertsList.sort((a, b) => {
      const daysA = differenceInDays(a.dueDate, new Date())
      const daysB = differenceInDays(b.dueDate, new Date())
      return daysA - daysB
    })
  }, [bills])

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Despesas" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Contas a Pagar" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gerencie e acompanhe todas as despesas da igreja</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/contas-a-pagar/categorias">Categorias</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contas-a-pagar/fornecedores">Fornecedores</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contas-a-pagar/calendario">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendário
              </Link>
            </Button>
            <Button asChild>
              <Link href="/contas-a-pagar/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Link>
            </Button>
          </div>
        </div>

        {/* Alertas de Vencimento */}
        {alerts.length > 0 && (
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Vencimento
              </CardTitle>
              <CardDescription>
                {alerts.length} despesa(s) do mês vencendo nos próximos 7 dias ou já vencidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.slice(0, 5).map((bill) => {
                  const daysUntil = differenceInDays(bill.dueDate, new Date())
                  const isOverdue = isPast(bill.dueDate)
                  
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bill.description}</span>
                          <Badge variant={isOverdue ? "destructive" : "outline"}>
                            {isOverdue ? "Vencida" : `Vence em ${daysUntil}d`}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(bill.dueDate)} • {bill.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(bill.amount)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBill(bill)
                            setPayDialogOpen(true)
                          }}
                          className="mt-1"
                        >
                          Pagar
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {alerts.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {alerts.length - 5} outra(s) conta(s) com alerta
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Saldo do Mês */}
        {monthBalance && (
          <Card className={cn(
            "border-2",
            monthBalance.balance >= 0 
              ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20" 
              : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center gap-2",
                monthBalance.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {monthBalance.balance >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                Saldo do Mês
              </CardTitle>
              <CardDescription>
                {monthBalance.balance >= 0 ? "Saldo positivo" : "Saldo negativo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className={cn(
                    "text-4xl font-bold mb-2",
                    monthBalance.balance >= 0 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(monthBalance.balance)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Entradas</p>
                      <p className="font-semibold text-emerald-600">{formatCurrency(monthBalance.income)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="font-semibold text-red-600">{formatCurrency(monthBalance.expense)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Total Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingBills.length} despesa(s) pendente(s)
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueBills.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(stats.totalOverdue)} em atraso
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Vencem em 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.upcomingBills.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(stats.totalUpcoming)} a vencer
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Pagas este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.totalPaidThisMonth)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {stats.monthComparison !== 0 && (
                  <>
                    {stats.monthComparison > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <p className={cn(
                      "text-xs",
                      stats.monthComparison > 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {Math.abs(stats.monthComparison).toFixed(1)}% vs mês anterior
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Análises */}
        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista">Lista de Despesas</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos e Análises</TabsTrigger>
            <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      {showFilters ? "Ocultar" : "Mostrar"} Filtros
                    </Button>
                    {(statusFilter !== "all" || categoryFilter !== "all" || supplierFilter !== "all" || searchTerm || dateRange.from || dateRange.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("all")
                          setCategoryFilter("all")
                          setSupplierFilter("all")
                          setSearchTerm("")
                          setDateRange({})
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {showFilters && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Buscar</Label>
                      <Input
                        placeholder="Descrição, fornecedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="atrasado">Atrasado</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fornecedor</Label>
                      <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {suppliers.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id}>
                              {sup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento de</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP", { locale: ptBR }) : "Selecione"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento até</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP", { locale: ptBR }) : "Selecione"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Tabela */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Despesas</CardTitle>
                    <CardDescription>
                      {filteredBills.length} despesa(s) encontrada(s)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={columns} 
                  data={filteredBills} 
                  searchKey="description" 
                  searchPlaceholder="Buscar despesas..." 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graficos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Mês</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="valor" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription>Top 6 categorias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Resumo detalhado por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    filteredBills.reduce((acc, bill) => {
                      if (bill.status !== "pago") return acc
                      if (!acc[bill.category]) {
                        acc[bill.category] = { total: 0, count: 0 }
                      }
                      acc[bill.category].total += bill.amount
                      acc[bill.category].count += 1
                      return acc
                    }, {} as Record<string, { total: number; count: number }>)
                  )
                    .map(([category, data]) => ({ category, ...data }))
                    .sort((a, b) => b.total - a.total)
                    .map(({ category, total, count }) => (
                      <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{category}</p>
                          <p className="text-sm text-muted-foreground">{count} conta(s)</p>
                        </div>
                        <p className="text-lg font-semibold">{formatCurrency(total)}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pay Bill Dialog */}
        <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Pago</DialogTitle>
              <DialogDescription>Registre o pagamento da conta {selectedBill?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold">{selectedBill && formatCurrency(selectedBill.amount)}</p>
              </div>

              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {payDate ? format(payDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={payDate} onSelect={(d) => d && setPayDate(d)} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comprovante (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Clique para anexar</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePayBill} disabled={!payMethod || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Despesa</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a despesa "{billToDelete?.description}"? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {billToDelete && (
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-semibold">{formatCurrency(billToDelete.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vencimento</p>
                      <p className="font-semibold">{formatDate(billToDelete.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={billToDelete.status === "pago" ? "default" : "outline"}>
                        {billToDelete.status === "pago" ? "Pago" : billToDelete.status === "atrasado" ? "Atrasado" : "Pendente"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Categoria</p>
                      <p className="font-semibold">{billToDelete.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? (
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
