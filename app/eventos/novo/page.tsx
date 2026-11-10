"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EventForm, type EventFormResult } from "@/components/events/event-form"
import { createEvent, updateEvent } from "@/lib/services/events"
import { createCashBox } from "@/lib/services/cash"

export default function NovoEventoPage() {
  const router = useRouter()

  const handleSubmit = async ({ data, createCashBox: withCashBox }: EventFormResult) => {
    try {
      const event = await createEvent(data)

      if (withCashBox) {
        try {
          const box = await createCashBox({
            name: `Caixa - ${event.name}`,
            type: "evento",
            eventId: event.id,
            balance: 0,
            initialBalance: 0,
          })
          await updateEvent(event.id, { cashBoxId: box.id })
        } catch (error) {
          console.error("Erro ao criar caixa do evento:", error)
          toast.warning("Evento criado, mas não foi possível criar o caixa do evento.")
        }
      }

      toast.success("Evento criado com sucesso!")
      router.push("/eventos")
    } catch (error) {
      console.error("Erro ao criar evento:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao criar evento")
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Eventos", href: "/eventos" }, { label: "Novo Evento" }]}>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Novo Evento</h1>
          <p className="text-muted-foreground">Cultos, reuniões, retiros e outros eventos da igreja</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do evento</CardTitle>
            <CardDescription>O evento aparece automaticamente na Agenda</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm submitLabel="Criar Evento" onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
