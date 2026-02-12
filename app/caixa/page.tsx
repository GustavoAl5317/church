"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { getCashBoxes, getCashTransactions } from "@/lib/services/cash"
import { getEvents } from "@/lib/services/events"
import { getServices } from "@/lib/services/services"
import type { CashBox, CashTransaction, Event, Service } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { serviceTypes } from "@/lib/constants"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { toast } from "sonner"

export default function CaixaPage() {
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
    
    // Escutar eventos de atualização
    const handleRefresh = () => {
      loadData()
    }
    
    window.addEventListener('cash:refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('cash:refresh', handleRefresh)
    }
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [boxesData, eventsData, servicesData] = await Promise.all([
        getCashBoxes(),
        getEvents(),
        getServices(),
      ])
      
      setCashBoxes(boxesData)
      setEvents(eventsData)
      setServices(servicesData)

      const generalCashBox = boxesData.find((c) => c.type === "geral")
      if (generalCashBox) {
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        const transactionsData = await getCashTransactions(
          generalCashBox.id,
          startOfDay(monthStart),
          endOfDay(monthEnd)
        )
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error("Error loading cash data:", error)
      toast.error("Erro ao carregar dados do caixa")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Caixa" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  const generalCashBox = cashBoxes.find((c) => c.type === "geral")
  const eventCashBoxes = cashBoxes.filter((c) => c.type === "evento")

  const recentTransactions = transactions
    .filter((t) => t.cashBoxId === generalCashBox?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const monthIncomes = transactions
    .filter((t) => t.cashBoxId === generalCashBox?.id && t.type === "entrada")
    .reduce((sum, t) => sum + t.amount, 0)

  const monthExpenses = transactions
    .filter((t) => t.cashBoxId === generalCashBox?.id && t.type === "saida")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <AppLayout breadcrumbs={[{ label: "Caixa" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
            <p className="text-muted-foreground">Controle financeiro da igreja</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar
            </Button>
            <Button variant="outline" asChild>
              <Link href="/caixa/transferencias">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transferências
              </Link>
            </Button>
            <Button asChild>
              <Link href="/caixa/nova-movimentacao">
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList>
            <TabsTrigger value="geral">Caixa Geral</TabsTrigger>
            <TabsTrigger value="cultos">Cultos</TabsTrigger>
            <TabsTrigger value="eventos">Caixas de Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(generalCashBox?.balance || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Saldo inicial: {formatCurrency(generalCashBox?.initialBalance || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entradas do Mês</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(monthIncomes)}</div>
                  <p className="text-xs text-muted-foreground">Janeiro 2025</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saídas do Mês</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(monthExpenses)}</div>
                  <p className="text-xs text-muted-foreground">Janeiro 2025</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resultado do Mês</CardTitle>
                  {monthIncomes - monthExpenses >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${monthIncomes - monthExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {formatCurrency(monthIncomes - monthExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">Entradas - Saídas</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Recent Transactions */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button variant="outline" className="justify-start bg-transparent" asChild>
                    <Link href="/caixa/nova-movimentacao?tipo=entrada">
                      <ArrowDownLeft className="mr-2 h-4 w-4 text-emerald-500" />
                      Registrar Entrada
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent" asChild>
                    <Link href="/caixa/nova-movimentacao?tipo=saida">
                      <ArrowUpRight className="mr-2 h-4 w-4 text-red-500" />
                      Registrar Saída
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent" asChild>
                    <Link href="/caixa/livro">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Ver Livro Caixa
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent" asChild>
                    <Link href="/caixa/transferencias">
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Nova Transferência
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Últimas Movimentações</CardTitle>
                    <CardDescription>Caixa Geral</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/caixa/livro">Ver todas</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              transaction.type === "entrada"
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : transaction.type === "saida"
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {transaction.type === "entrada" ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : transaction.type === "saida" ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowRightLeft className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              transaction.type === "entrada"
                                ? "text-emerald-600"
                                : transaction.type === "saida"
                                  ? "text-red-600"
                                  : "text-blue-600"
                            }`}
                          >
                            {transaction.type === "entrada" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cultos" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum culto encontrado</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/cultos">Ver Cultos</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                services.map((service) => {
                  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
                    agendado: { label: "Agendado", variant: "outline" },
                    em_andamento: { label: "Em Andamento", variant: "secondary" },
                    finalizado: { label: "Finalizado", variant: "default" },
                  }
                  const status = statusConfig[service.status] || { label: service.status, variant: "outline" as const }
                  
                  return (
                    <Card key={service.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(service.date)} às {service.time}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Arrecadado</p>
                          <p className={`text-2xl font-bold ${service.totalIncome > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {formatCurrency(service.totalIncome || 0)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-muted-foreground text-xs">Status</p>
                            <p className="font-medium">{status.label}</p>
                          </div>
                          <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20">
                            <p className="text-muted-foreground text-xs">Tipo</p>
                            <p className="font-medium">{serviceTypes.find((t) => t.value === service.type)?.label || service.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full bg-transparent" asChild>
                          <Link href={`/cultos/${service.id}`}>Ver Detalhes</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
            
            {/* Resumo de Arrecadação dos Cultos */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Arrecadação dos Cultos</CardTitle>
                  <CardDescription>Total arrecadado em todos os cultos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Arrecadado</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {formatCurrency(services.reduce((sum, s) => sum + (s.totalIncome || 0), 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Cultos Finalizados</p>
                      <p className="text-2xl font-bold mt-1">
                        {services.filter(s => s.status === 'finalizado').length}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Média por Culto</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(
                          services.filter(s => s.status === 'finalizado' && s.totalIncome > 0).length > 0
                            ? services
                                .filter(s => s.status === 'finalizado' && s.totalIncome > 0)
                                .reduce((sum, s) => sum + (s.totalIncome || 0), 0) /
                              services.filter(s => s.status === 'finalizado' && s.totalIncome > 0).length
                            : 0
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="eventos" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventCashBoxes.map((cashBox) => {
                const event = events.find((e) => e.id === cashBox.eventId)
                const eventTransactions = transactions.filter((t) => t.cashBoxId === cashBox.id)
                const incomes = eventTransactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0)
                const expenses = eventTransactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.amount, 0)

                return (
                  <Card key={cashBox.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cashBox.name}</CardTitle>
                        <Badge
                          variant={
                            event?.status === "em_andamento"
                              ? "default"
                              : event?.status === "finalizado"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {event?.status === "em_andamento"
                            ? "Em Andamento"
                            : event?.status === "finalizado"
                              ? "Finalizado"
                              : "Planejado"}
                        </Badge>
                      </div>
                      {event && (
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.startDate)}
                          {event.endDate && ` - ${formatDate(event.endDate)}`}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Saldo</p>
                        <p className="text-2xl font-bold">{formatCurrency(cashBox.balance)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="text-muted-foreground text-xs">Entradas</p>
                          <p className="font-medium text-emerald-600">{formatCurrency(incomes)}</p>
                        </div>
                        <div className="p-2 rounded bg-red-50 dark:bg-red-900/20">
                          <p className="text-muted-foreground text-xs">Saídas</p>
                          <p className="font-medium text-red-600">{formatCurrency(expenses)}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href={`/eventos/${cashBox.eventId}`}>Ver Detalhes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Add New Event Cash Box Card */}
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
                  <Plus className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-3">Criar caixa para novo evento</p>
                  <Button variant="outline" asChild>
                    <Link href="/eventos/novo">Criar Evento</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
