"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { getEvents } from "@/lib/services/events"
import { getServices } from "@/lib/services/services"
import { eventTypeLabels } from "@/lib/constants"

interface AgendaItem {
  id: string
  title: string
  start: Date
  end: Date
  time?: string
  location?: string
  kind: "evento" | "culto"
  label: string
  href?: string
}

/** "novembro de 2026" → "Novembro de 2026" (o CSS capitalize deixaria "De" maiúsculo) */
function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function occursOn(item: AgendaItem, day: Date) {
  const d = startOfDay(day)
  return d >= startOfDay(item.start) && d <= startOfDay(item.end)
}

function byTime(a: AgendaItem, b: AgendaItem) {
  return +a.start - +b.start || (a.time ?? "").localeCompare(b.time ?? "")
}

export default function AgendaPage() {
  const { can } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()))
  const [events, setEvents] = useState<AgendaItem[]>([])
  const [services, setServices] = useState<AgendaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))

  // Eventos: carrega uma vez (inclui os próximos para o painel lateral)
  useEffect(() => {
    getEvents()
      .then((list) =>
        setEvents(
          list
            .filter((e) => e.status !== "cancelado")
            .map((e) => ({
              id: e.id,
              title: e.name,
              start: e.startDate,
              end: e.endDate ?? e.startDate,
              time: e.startTime,
              location: e.location,
              kind: "evento" as const,
              label: eventTypeLabels[e.type],
              href: can("eventos", "manage") ? `/eventos/${e.id}/editar` : undefined,
            })),
        ),
      )
      .catch((error) => {
        console.error("Erro ao carregar eventos:", error)
        toast.error("Erro ao carregar eventos")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cultos: carrega o mês visível e os próximos 60 dias
  useEffect(() => {
    setIsLoading(true)
    const from = addDays(gridStart < new Date() ? gridStart : startOfDay(new Date()), -1)
    const to = addDays(gridEnd > addDays(new Date(), 60) ? gridEnd : addDays(new Date(), 60), 1)
    getServices(from, to)
      .then((list) =>
        setServices(
          list.map((s) => ({
            id: s.id,
            title: s.name,
            start: s.date,
            end: s.date,
            time: s.time?.slice(0, 5),
            kind: "culto" as const,
            label: "Culto",
            href: can("cultos") ? `/cultos/${s.id}` : undefined,
          })),
        ),
      )
      .catch((error) => console.error("Erro ao carregar cultos:", error))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const items = useMemo(() => [...events, ...services].sort(byTime), [events, services])

  const days = useMemo(() => {
    const list: Date[] = []
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) list.push(d)
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const today = startOfDay(new Date())
  const upcoming = items.filter((i) => startOfDay(i.end) >= today).slice(0, 6)
  const selectedItems = items.filter((i) => occursOn(i, selectedDay))

  const goToday = () => {
    setMonth(startOfMonth(new Date()))
    setSelectedDay(today)
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Agenda" }]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground">Programação de cultos e eventos da igreja</p>
          </div>
          {can("eventos", "manage") && (
            <Button asChild>
              <Link href="/eventos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl">{capitalizeFirst(format(month, "MMMM 'de' yyyy", { locale: ptBR }))}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMonth(subMonths(month, 1))}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={goToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMonth(addMonths(month, 1))}>
                  Próximo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="pb-2 text-center text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
                {days.map((day) => {
                  const dayItems = items.filter((i) => occursOn(i, day))
                  const inMonth = isSameMonth(day, month)
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDay(startOfDay(day))}
                      className={cn(
                        "flex min-h-16 flex-col rounded-md border p-1 text-left text-xs transition-colors hover:bg-muted sm:min-h-24 sm:p-2",
                        !inMonth && "bg-muted/40 text-muted-foreground",
                        isSameDay(day, selectedDay) && "border-primary ring-1 ring-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "mb-1 flex h-6 w-6 items-center justify-center rounded-full font-medium",
                          isSameDay(day, today) && "bg-primary text-primary-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="hidden space-y-1 sm:block">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={`${item.kind}-${item.id}`}
                            className={cn(
                              "truncate rounded px-1 py-0.5",
                              item.kind === "culto"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                            )}
                          >
                            {item.time && `${item.time} `}
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <div className="text-muted-foreground">+{dayItems.length - 2} mais</div>
                        )}
                      </div>
                      {dayItems.length > 0 && (
                        <span className="mt-auto h-1.5 w-1.5 self-center rounded-full bg-primary sm:hidden" />
                      )}
                    </button>
                  )
                })}
              </div>
              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{capitalizeFirst(format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR }))}</CardTitle>
                <CardDescription>
                  {selectedItems.length === 0
                    ? "Nada programado neste dia"
                    : `${selectedItems.length} item(ns) programado(s)`}
                </CardDescription>
              </CardHeader>
              {selectedItems.length > 0 && (
                <CardContent className="space-y-2">
                  {selectedItems.map((item) => (
                    <AgendaEntry key={`${item.kind}-${item.id}`} item={item} />
                  ))}
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento programado.</p>
                ) : (
                  upcoming.map((item) => <AgendaEntry key={`${item.kind}-${item.id}`} item={item} showDate />)
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function AgendaEntry({ item, showDate }: { item: AgendaItem; showDate?: boolean }) {
  const content = (
    <div className="rounded-md border bg-muted/30 p-3 text-sm transition-colors hover:bg-muted">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{item.title}</p>
        <span className="text-xs text-muted-foreground">{item.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {showDate && format(item.start, "dd/MM/yyyy")}
        {showDate && item.time && " · "}
        {item.time}
        {item.location && ` · ${item.location}`}
      </p>
    </div>
  )
  return item.href ? <Link href={item.href}>{content}</Link> : content
}
