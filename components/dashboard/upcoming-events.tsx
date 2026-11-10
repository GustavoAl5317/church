"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEvents } from "@/lib/services/events"
import { eventTypeLabels } from "@/lib/constants"
import type { Event } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"

/** Próximos eventos, para quem não vê a parte financeira do dashboard */
export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[] | null>(null)

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    getEvents().then((list) =>
      setEvents(
        list
          .filter((e) => e.status !== "cancelado" && (e.endDate ?? e.startDate) >= today)
          .sort((a, b) => +a.startDate - +b.startDate)
          .slice(0, 5),
      ),
    )
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos eventos
          </CardTitle>
          <CardDescription>A programação da igreja</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agenda">
            Ver agenda
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {events === null ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento programado.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{event.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.startDate)}
                  {event.startTime && ` às ${event.startTime}`}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{eventTypeLabels[event.type]}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
