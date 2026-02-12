"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { getCashTransactions, getCashBoxes } from "@/lib/services/cash"
import type { CashTransaction } from "@/lib/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
    
    // Escutar eventos de atualização
    const handleRefresh = () => {
      loadTransactions()
    }
    
    window.addEventListener('dashboard:refresh', handleRefresh)
    window.addEventListener('cash:refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh)
      window.removeEventListener('cash:refresh', handleRefresh)
    }
  }, [])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const cashBoxes = await getCashBoxes()
      const generalCashBox = cashBoxes.find((c) => c.type === 'geral')
      
      if (generalCashBox) {
        const data = await getCashTransactions(generalCashBox.id)
        setTransactions(data.slice(0, 5))
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
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
          <CardTitle>Últimas Movimentações</CardTitle>
          <CardDescription>Transações recentes do caixa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
          <CardDescription>Transações recentes do caixa</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação encontrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 rounded-t-lg">
        <div>
          <CardTitle className="text-xl font-bold">Últimas Movimentações</CardTitle>
          <CardDescription>Transações recentes do caixa geral</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadTransactions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/caixa/livro">
              Ver todas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Link
              key={transaction.id}
              href="/caixa/livro"
              className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110 ${
                    transaction.type === "entrada"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "entrada" ? (
                    <ArrowDownLeft className="h-6 w-6" />
                  ) : (
                    <ArrowUpRight className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate">{transaction.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {format(transaction.date, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground truncate">{transaction.responsibleName}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-lg font-bold ${
                    transaction.type === "entrada"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "entrada" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
