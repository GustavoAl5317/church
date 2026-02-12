"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Download,
  FileText,
  CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Filter,
  MoreHorizontal,
  Eye,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { paymentMethods } from "@/lib/constants"
import { getCashTransactions, getCashBoxes } from "@/lib/services/cash"
import type { CashTransaction, CashBox } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"

const columns: ColumnDef<CashTransaction>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => formatDate(row.getValue("date")),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const configs: Record<string, { label: string; icon: any; className: string }> = {
        entrada: {
          label: "Entrada",
          icon: ArrowDownLeft,
          className: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
        },
        saida: {
          label: "Saída",
          icon: ArrowUpRight,
          className: "text-red-600 bg-red-100 dark:bg-red-900/30",
        },
        transferencia: {
          label: "Transferência",
          icon: ArrowRightLeft,
          className: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        },
      }

      const config = configs[type] || {
        label: type,
        icon: ArrowRightLeft,
        className: "text-muted-foreground bg-muted",
      }

      const Icon = config.icon

      return (
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.className}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span>{config.label}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
  },
  {
    accessorKey: "paymentMethod",
    header: "Pagamento",
    cell: ({ row }) => {
      const method = paymentMethods.find((m) => m.value === row.getValue("paymentMethod"))
      return method?.label || (row.getValue("paymentMethod") as any)
    },
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => {
      const type = row.original.type
      const amount = row.getValue("amount") as number
      return (
        <span
          className={`font-medium ${
            type === "entrada" ? "text-emerald-600" : type === "saida" ? "text-red-600" : "text-blue-600"
          }`}
        >
          {type === "entrada" ? "+" : type === "saida" ? "-" : ""}
          {formatCurrency(amount)}
        </span>
      )
    },
  },
  {
    accessorKey: "responsibleName",
    header: "Responsável",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/caixa/movimentacao/${transaction.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function LivroCaixaPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedCashBox, setSelectedCashBox] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [boxesData, transactionsData] = await Promise.all([getCashBoxes(), getCashTransactions()])
      setCashBoxes(boxesData)
      setTransactions(transactionsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter transactions
  let filteredTransactions = [...transactions]

  if (selectedCashBox !== "all") {
    filteredTransactions = filteredTransactions.filter((t) => t.cashBoxId === selectedCashBox)
  }

  if (selectedType !== "all") {
    filteredTransactions = filteredTransactions.filter((t) => t.type === selectedType)
  }

  if (dateRange.from) {
    filteredTransactions = filteredTransactions.filter((t) => new Date(t.date) >= dateRange.from!)
  }
  if (dateRange.to) {
    filteredTransactions = filteredTransactions.filter((t) => new Date(t.date) <= dateRange.to!)
  }

  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalEntradas = filteredTransactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0)
  const totalSaidas = filteredTransactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.amount, 0)

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Caixa", href: "/caixa" }, { label: "Livro Caixa" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Caixa", href: "/caixa" }, { label: "Livro Caixa" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Livro Caixa</h1>
            <p className="text-muted-foreground">Histórico de todas as movimentações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Caixa</label>
                <Select value={selectedCashBox} onValueChange={setSelectedCashBox}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os caixas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os caixas</SelectItem>
                    {cashBoxes.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                    <SelectItem value="transferencia">Transferências</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")} type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "PPP", { locale: ptBR })
                        )
                      ) : (
                        "Selecionar período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Entradas</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEntradas)}</p>
                </div>
                <ArrowDownLeft className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Saídas</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Período</p>
                  <p className={`text-2xl font-bold ${totalEntradas - totalSaidas >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(totalEntradas - totalSaidas)}
                  </p>
                </div>
                {totalEntradas - totalSaidas >= 0 ? (
                  <ArrowDownLeft className="h-8 w-8 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable columns={columns} data={filteredTransactions} searchKey="description" searchPlaceholder="Buscar movimentações..." />
      </div>
    </AppLayout>
  )
}
