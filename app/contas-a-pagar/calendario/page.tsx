"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { billCategories } from "@/lib/constants"
import { getBillsPayable } from "@/lib/services/bills"
import type { BillPayable } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"
import { toast } from "sonner"

export default function CalendarioContasPage() {
  const [bills, setBills] = useState<BillPayable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      setIsLoading(true)
      const data = await getBillsPayable()
      setBills(data)
    } catch (error) {
      console.error("Error loading bills:", error)
      toast.error("Erro ao carregar contas")
    } finally {
      setIsLoading(false)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Filter bills
  let filteredBills = bills.filter((bill) => {
    const billDate = new Date(bill.dueDate)
    return billDate >= monthStart && billDate <= monthEnd
  })

  if (selectedCategory !== "all") {
    filteredBills = filteredBills.filter((bill) => bill.category === selectedCategory)
  }

  // Get bills for selected date
  const selectedDateBills = selectedDate
    ? bills.filter((bill) => isSameDay(new Date(bill.dueDate), selectedDate))
    : []

  // Get days with bills
  const daysWithBills = filteredBills.map((bill) => new Date(bill.dueDate))

  // Calculate totals for the month
  const monthTotal = filteredBills.reduce((sum, bill) => sum + bill.amount, 0)
  const monthPending = filteredBills.filter((b) => b.status === "pendente" || b.status === "atrasado")
  const monthPendingTotal = monthPending.reduce((sum, bill) => sum + bill.amount, 0)

  const getStatusBadge = (bill: BillPayable) => {
    if (bill.status === "pago") {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Pago
        </Badge>
      )
    }
    if (bill.status === "atrasado" || (bill.status === "pendente" && isPast(bill.dueDate))) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Atrasada
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Pendente
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Calendário" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Contas a Pagar", href: "/contas-a-pagar" }, { label: "Calendário" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Vencimentos</h1>
            <p className="text-muted-foreground">Visualize as despesas a vencer por data</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
          {/* Calendar Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</CardTitle>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {billCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                className="w-full"
                modifiers={{
                  hasBills: daysWithBills,
                }}
                modifiersStyles={{
                  hasBills: {
                    fontWeight: "bold",
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                    borderRadius: "0.375rem",
                  },
                }}
              />

              {/* Monthly Summary */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total do Mês</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthTotal)}</p>
                  <p className="text-xs text-muted-foreground">{filteredBills.length} conta(s)</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400">Pendente</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(monthPendingTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">{monthPending.length} conta(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Bills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateBills.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateBills.map((bill) => (
                      <Link
                        key={bill.id}
                        href={`/contas-a-pagar/${bill.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{bill.description}</p>
                            {bill.supplierName && <p className="text-xs text-muted-foreground">{bill.supplierName}</p>}
                          </div>
                          {getStatusBadge(bill)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {billCategories.find((c) => c.value === bill.category)?.label}
                          </Badge>
                          <span className="font-medium">{formatCurrency(bill.amount)}</span>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total do dia</span>
                        <span className="font-bold">
                          {formatCurrency(selectedDateBills.reduce((sum, b) => sum + b.amount, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma conta para esta data</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Clique em uma data para ver as contas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
