"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, FileText, CheckCircle, Church, Clock, Calendar, Loader2 } from "lucide-react"
import { serviceTypes, incomeTypes, paymentMethods } from "@/lib/constants"
import type { Service, ServiceIncome } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getService, getServiceIncomes } from "@/lib/services/services"

export default function CultoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [incomes, setIncomes] = useState<ServiceIncome[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [serviceData, incomesData] = await Promise.all([
        getService(id),
        getServiceIncomes(id),
      ])
      setService(serviceData)
      setIncomes(incomesData)
    } catch (error) {
      console.error("Error loading service:", error)
      setService(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Carregando..." }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!service) {
    return (
      <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Não encontrado" }]}>
        <div className="flex flex-col items-center justify-center py-12">
          <Church className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Culto não encontrado</h1>
          <p className="text-muted-foreground mb-4">O culto solicitado não existe ou foi removido.</p>
          <Button onClick={() => router.push("/cultos")}>Voltar para Cultos</Button>
        </div>
      </AppLayout>
    )
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    agendado: { label: "Agendado", variant: "outline" },
    em_andamento: { label: "Em Andamento", variant: "secondary" },
    finalizado: { label: "Finalizado", variant: "default" },
  }

  const totalArrecadado = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const arrecadacaoPorTipo = incomes.reduce((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + inc.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: service.name }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
              <p className="text-muted-foreground">
                {serviceTypes.find((t) => t.value === service.type)?.label || service.type}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {service.status === "agendado" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/cultos/${id}/editar`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/cultos/fechamento?id=${id}`}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Fechar Culto
                  </Link>
                </Button>
              </>
            )}
            {service.status === "finalizado" && (
              <Button variant="outline" asChild>
                <Link href={`/cultos/${id}/relatorio`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações do Culto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{formatDate(service.date, "EEEE, dd 'de' MMMM 'de' yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{service.time}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusConfig[service.status].variant}>{statusConfig[service.status].label}</Badge>
              </div>

              {service.observations && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{service.observations}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>Entradas registradas no culto</CardDescription>
            </CardHeader>
            <CardContent>
              {service.status === "finalizado" ? (
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Arrecadado</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(service.totalIncome || 0)}</p>
                  </div>

                  {incomes.length > 0 ? (
                    <div className="space-y-3">
                      {/* Agrupar por tipo */}
                      {Object.entries(arrecadacaoPorTipo).map(([type, amount]) => {
                        const typeLabel = incomeTypes.find((t) => t.value === type)?.label || type
                        const typeIncomes = incomes.filter((i) => i.type === type)
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{typeLabel}</span>
                              <span className="font-semibold text-emerald-600">{formatCurrency(amount)}</span>
                            </div>
                            {typeIncomes.length > 1 && (
                              <div className="pl-4 space-y-1 text-xs text-muted-foreground">
                                {typeIncomes.map((income) => (
                                  <div key={income.id} className="flex justify-between">
                                    <span>{paymentMethods.find((m) => m.value === income.paymentMethod)?.label}</span>
                                    <span>{formatCurrency(income.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <Separator />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total</span>
                        <span className="text-lg text-emerald-600">{formatCurrency(totalArrecadado)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma entrada registrada
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Church className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Culto ainda não finalizado</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/cultos/fechamento?id=${id}`}>Realizar Fechamento</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
