"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { getServices } from "@/lib/services/services"
import type { Service } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/utils/format"
import { format, isToday, isPast, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

export function PendingServicesCard() {
  const [pendingServices, setPendingServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPendingServices()
  }, [])

  const loadPendingServices = async () => {
    try {
      setIsLoading(true)
      const allServices = await getServices()
      // Cultos agendados que já passaram ou são hoje
      const pending = allServices
        .filter((s) => s.status === "agendado")
        .filter((s) => {
          const serviceDate = new Date(s.date)
          return isPast(serviceDate) || isToday(serviceDate)
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
      setPendingServices(pending)
    } catch (error) {
      console.error("Error loading pending services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null
  }

  if (pendingServices.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Cultos Aguardando Registro
            </CardTitle>
            <CardDescription>
              {pendingServices.length === 1
                ? "Há 1 culto que precisa ter a arrecadação registrada"
                : `Há ${pendingServices.length} cultos que precisam ter a arrecadação registrada`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingServices.map((service) => {
            const serviceDate = new Date(service.date)
            const isTodayService = isToday(serviceDate)
            const daysAgo = differenceInDays(new Date(), serviceDate)

            return (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(serviceDate, "dd/MM/yyyy", { locale: ptBR })} às {service.time}
                        {isTodayService && (
                          <Badge variant="default" className="ml-2">
                            Hoje
                          </Badge>
                        )}
                        {!isTodayService && daysAgo > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {daysAgo} {daysAgo === 1 ? "dia atrás" : "dias atrás"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/cultos/fechamento?id=${service.id}`}>
                    Registrar Arrecadação
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/cultos/fechamento">Ver Todos os Cultos Pendentes</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
