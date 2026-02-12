"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { getBillsPayable } from "@/lib/services/bills"
import type { BillPayable } from "@/lib/types"
import { format, differenceInDays, isPast, startOfMonth, endOfMonth, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

export function UpcomingBills() {
  const [bills, setBills] = useState<BillPayable[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBills()
    
    // Escutar eventos de atualização
    const handleRefresh = () => {
      loadBills()
    }
    
    window.addEventListener('dashboard:refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh)
    }
  }, [])

  const loadBills = async () => {
    try {
      setIsLoading(true)
      const data = await getBillsPayable()
      const pendingBills = data
        .filter((bill) => bill.status === "pendente" || bill.status === "atrasado")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
      setBills(pendingBills)
    } catch (error) {
      console.error("Error loading bills:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Despesas</CardTitle>
          <CardDescription>Despesas a vencer nos próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Despesas</CardTitle>
          <CardDescription>Despesas a vencer nos próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa pendente</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (dueDate: Date, status: string) => {
    if (status === "atrasado" || isPast(dueDate)) {
      return <Badge variant="destructive">Atrasada</Badge>
    }
    const daysUntil = differenceInDays(dueDate, new Date())
    if (daysUntil <= 3) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Vence em {daysUntil}d</Badge>
    }
    if (daysUntil <= 7) {
      return <Badge variant="secondary">Vence em {daysUntil}d</Badge>
    }
    return <Badge variant="outline">Pendente</Badge>
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 rounded-t-lg">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Próximas Despesas
          </CardTitle>
          <CardDescription>Despesas do mês atual</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadBills} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contas-a-pagar">
              Ver todas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {bills.map((bill) => {
            const isOverdue = bill.status === "atrasado" || isPast(bill.dueDate)
            const daysUntil = differenceInDays(bill.dueDate, new Date())
            
            return (
              <Link
                key={bill.id}
                href="/contas-a-pagar"
                className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110 ${
                      isOverdue
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none truncate">{bill.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vence em {format(bill.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(bill.dueDate, bill.status)}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-bold ${isOverdue ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
