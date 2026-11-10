"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EventForm, type EventFormResult } from "@/components/events/event-form"
import { getEvent, updateEvent } from "@/lib/services/events"
import type { Event } from "@/lib/types"

export default function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getEvent(id)
      .then(setEvent)
      .catch((error) => {
        console.error("Erro ao carregar evento:", error)
        setEvent(null)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async ({ data }: EventFormResult) => {
    try {
      await updateEvent(id, data)
      toast.success("Evento atualizado com sucesso!")
      router.push("/eventos")
    } catch (error) {
      console.error("Erro ao atualizar evento:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar evento")
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Eventos", href: "/eventos" }, { label: "Editar" }]}>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Editar Evento</h1>
          <p className="text-muted-foreground">Atualize os dados e registre a presença</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !event ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">Evento não encontrado.</p>
              <Button onClick={() => router.push("/eventos")}>Voltar para Eventos</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Informações do evento</CardTitle>
              <CardDescription>{event.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm initial={event} submitLabel="Salvar alterações" onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
