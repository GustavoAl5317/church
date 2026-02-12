"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Church, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react"
import { getServices } from "@/lib/services/services"
import type { Service } from "@/lib/types"
import { format, differenceInDays, isPast, addDays, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatDate } from "@/lib/utils/format"

export function UpcomingServices() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const today = startOfDay(new Date())
      // Buscar todos os cultos a partir de hoje (sem limite de data futura)
      const data = await getServices(today)
      // Filtrar apenas cultos agendados que ainda não passaram (comparando apenas a data, não a hora)
      const upcoming = data
        .filter(s => {
          const serviceDate = startOfDay(s.date)
          return s.status === 'agendado' && serviceDate >= today
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 10) // Mostrar os próximos 10 cultos programados
      setServices(upcoming)
    } catch (error) {
      console.error("Error loading services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="h-5 w-5" />
            Próximos Cultos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="h-5 w-5" />
            Próximos Cultos
          </CardTitle>
          <CardDescription>Nenhum culto agendado para os próximos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild className="w-full">
            <Link href="/cultos/novo">
              <Church className="mr-2 h-4 w-4" />
              Agendar Culto
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Church className="h-5 w-5 text-primary" />
              Próximos Cultos
            </CardTitle>
            <CardDescription>
              {services.length} culto(s) programado(s)
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cultos">Ver Todos</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {services.map((service) => {
            const daysUntil = differenceInDays(service.date, new Date())
            const isToday = daysUntil === 0
            const isTomorrow = daysUntil === 1
            
            return (
              <Link
                key={service.id}
                href={`/cultos/${service.id}`}
                className="block p-4 rounded-lg border hover:bg-muted/50 transition-all hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm transition-transform group-hover:scale-110 flex-shrink-0">
                      <Church className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold truncate text-base">{service.name}</h4>
                        {isToday && (
                          <Badge variant="default" className="text-xs">Hoje</Badge>
                        )}
                        {isTomorrow && (
                          <Badge variant="outline" className="text-xs">Amanhã</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="font-medium">{format(service.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{service.time}</span>
                        </div>
                      </div>
                      {service.totalIncome > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Arrecadado: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.totalIncome)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {daysUntil <= 2 && (
                    <div className="flex-shrink-0">
                      <Badge variant={isToday ? "default" : "secondary"} className="text-sm px-3 py-1">
                        {isToday ? "Hoje" : isTomorrow ? "Amanhã" : `${daysUntil}d`}
                      </Badge>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
