"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { getMonthlyChartData, getIncomeByTypeData } from "@/lib/services/dashboard"
import type { ChartData, IncomeByTypeData } from "@/lib/types"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const chartConfig = {
  entradas: {
    label: "Entradas",
    color: "var(--chart-2)",
  },
  gastos: {
    label: "Gastos",
    color: "var(--chart-5)",
  },
}

export function IncomeExpenseChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChartData()
    
    // Escutar eventos de atualização
    const handleRefresh = () => {
      loadChartData()
    }
    
    window.addEventListener('dashboard:refresh', handleRefresh)
    window.addEventListener('cash:refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh)
      window.removeEventListener('cash:refresh', handleRefresh)
    }
  }, [])

  const loadChartData = async () => {
    try {
      setIsLoading(true)
      const data = await getMonthlyChartData(6)
      setChartData(data)
    } catch (error) {
      console.error("Error loading chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Entradas vs Gastos</CardTitle>
          <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-2 border-2 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 rounded-t-lg">
        <div>
          <CardTitle className="text-xl font-bold">Entradas vs Gastos</CardTitle>
          <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={loadChartData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <XAxis 
                dataKey="month" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Bar dataKey="entradas" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Gastos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function IncomeByTypeChart() {
  const [incomeData, setIncomeData] = useState<IncomeByTypeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadIncomeData()
    
    // Escutar eventos de atualização
    const handleRefresh = () => {
      loadIncomeData()
    }
    
    window.addEventListener('dashboard:refresh', handleRefresh)
    window.addEventListener('cash:refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh)
      window.removeEventListener('cash:refresh', handleRefresh)
    }
  }, [])

  const loadIncomeData = async () => {
    try {
      setIsLoading(true)
      const data = await getIncomeByTypeData()
      setIncomeData(data)
    } catch (error) {
      console.error("Error loading income data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entradas por Tipo</CardTitle>
          <CardDescription>Distribuição do mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (incomeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entradas por Tipo</CardTitle>
          <CardDescription>Distribuição do mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-t-lg">
        <div>
          <CardTitle className="text-xl font-bold">Entradas por Tipo</CardTitle>
          <CardDescription>Distribuição do mês atual</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={loadIncomeData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={incomeData}
                dataKey="value"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {incomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {incomeData.map((item, index) => (
            <div key={item.type} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-sm font-medium">{item.type}</span>
              <span className="text-xs text-muted-foreground">
                ({new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
