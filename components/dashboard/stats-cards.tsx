"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboardSummary } from "@/lib/services/dashboard"
import type { DashboardSummary } from "@/lib/types"

export function StatsCards() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSummary()
    
    // Escutar eventos de atualização
    const handleRefresh = () => {
      loadSummary()
    }
    
    window.addEventListener('dashboard:refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh)
    }
  }, [])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const data = await getDashboardSummary()
      console.log('📊 Dashboard Summary carregado:', data)
      setSummary(data)
    } catch (error) {
      console.error("Error loading dashboard summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const stats = [
    {
      title: "Saldo Caixa Geral",
      value: formatCurrency(summary.generalBalance),
      icon: Wallet,
      description: "Saldo atual disponível",
      trend: null,
    },
    {
      title: "Entradas do Mês",
      value: formatCurrency(summary.monthIncome),
      icon: TrendingUp,
      description: "Entradas do mês atual",
      trend: "up",
      trendValue: null,
    },
    {
      title: "Gastos do Mês",
      value: formatCurrency(summary.monthExpense),
      icon: TrendingDown,
      description: "Gastos do mês atual",
      trend: "down",
      trendValue: null,
    },
    {
      title: "Resultado do Mês",
      value: formatCurrency(summary.monthBalance),
      icon: summary.monthBalance >= 0 ? TrendingUp : TrendingDown,
      description: summary.monthBalance >= 0 ? "Saldo positivo" : "Saldo negativo",
      trend: summary.monthBalance >= 0 ? "up" : "down",
      variant: summary.monthBalance >= 0 ? undefined : "danger" as const,
    },
    {
      title: "Despesas a Vencer",
      value: summary.upcomingBills.toString(),
      icon: AlertTriangle,
      description: "Do mês atual",
      variant: "warning" as const,
    },
    {
      title: "Despesas Atrasadas",
      value: summary.overdueBills.toString(),
      icon: AlertCircle,
      description: "Do mês atual",
      variant: "danger" as const,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumo Financeiro</h2>
          <p className="text-sm text-muted-foreground">Visão geral das finanças da igreja</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSummary} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, index) => {
          const isPositive = stat.trend === "up" || (stat.variant !== "danger" && stat.variant !== "warning")
          const bgColor = stat.variant === "danger" 
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
            : stat.variant === "warning"
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
            : isPositive
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
            : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
          
          const iconColor = stat.variant === "danger"
            ? "text-red-600 dark:text-red-400"
            : stat.variant === "warning"
            ? "text-amber-600 dark:text-amber-400"
            : isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-blue-600 dark:text-blue-400"

          return (
            <Card key={stat.title} className={`relative overflow-hidden ${bgColor} transition-all hover:shadow-lg`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current/5 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-400', '-900/20')}`}>
                  <stat.icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-3xl font-bold mb-1 ${
                  stat.variant === "danger" ? "text-red-600 dark:text-red-400" :
                  stat.variant === "warning" ? "text-amber-600 dark:text-amber-400" :
                  isPositive ? "text-emerald-600 dark:text-emerald-400" :
                  "text-blue-600 dark:text-blue-400"
                }`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                  {stat.trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
