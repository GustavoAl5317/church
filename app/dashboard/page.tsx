"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { IncomeExpenseChart, IncomeByTypeChart } from "@/components/dashboard/charts"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { UpcomingBills } from "@/components/dashboard/upcoming-bills"
import { UpcomingServices } from "@/components/dashboard/upcoming-services"
import { IncomeAlerts } from "@/components/dashboard/income-alerts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, Calendar, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  return (
    <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das finanças e atividades da igreja</p>
        </div>

        {/* Alertas de Classificação de Entradas */}
        <IncomeAlerts />

        {/* Cards de Estatísticas */}
        <StatsCards />

        {/* Cultos e Contas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingServices />
          <UpcomingBills />
        </div>

        {/* Gráficos e Análises */}
        <Tabs defaultValue="graficos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="transacoes">Transações Recentes</TabsTrigger>
          </TabsList>

          <TabsContent value="graficos" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Entradas vs Gastos
                  </CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <IncomeExpenseChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    Receitas por Tipo
                  </CardTitle>
                  <CardDescription>Distribuição do mês atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <IncomeByTypeChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Últimas movimentações financeiras</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
