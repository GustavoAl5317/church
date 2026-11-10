"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { serviceTypes } from "@/lib/constants"
import { getService, updateService } from "@/lib/services/services"
import type { Service, ServiceType } from "@/lib/types"

export default function EditarCultoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<ServiceType>("culto_familia")
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [observations, setObservations] = useState("")

  useEffect(() => {
    getService(id)
      .then((data) => {
        setService(data)
        setName(data.name)
        setType(data.type)
        setDate(data.date)
        setTime(data.time?.slice(0, 5) ?? "")
        setObservations(data.observations ?? "")
      })
      .catch((error) => {
        console.error("Erro ao carregar culto:", error)
        setService(null)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date || !time) {
      toast.error("Preencha nome, data e horário")
      return
    }
    setIsSaving(true)
    try {
      await updateService(id, { name: name.trim(), type, date, time, observations })
      toast.success("Culto atualizado")
      router.push(`/cultos/${id}`)
    } catch (error) {
      console.error("Erro ao atualizar culto:", error)
      toast.error("Erro ao atualizar culto")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Editar" }]}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Editar Culto</h1>
          <p className="text-muted-foreground">Altere os dados do culto agendado</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !service ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">Culto não encontrado.</p>
              <Button onClick={() => router.push("/cultos")}>Voltar para Cultos</Button>
            </CardContent>
          </Card>
        ) : service.status !== "agendado" ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground">Só é possível editar cultos que ainda estão agendados.</p>
              <Button onClick={() => router.push(`/cultos/${id}`)}>Voltar para o culto</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Informações do culto</CardTitle>
              <CardDescription>{service.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ServiceType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
