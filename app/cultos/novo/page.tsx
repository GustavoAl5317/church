"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { serviceTypes, dayOfWeekOptions } from "@/lib/constants"
import { createServiceTemplate, createService } from "@/lib/services/services"
import { toast } from "sonner"

export default function NovoCultoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [date, setDate] = useState<Date>()
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    time: "",
    dayOfWeek: "",
    observations: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type || !formData.time) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (isRecurring && !formData.dayOfWeek) {
      toast.error("Selecione o dia da semana para cultos recorrentes")
      return
    }

    if (!isRecurring && !date) {
      toast.error("Selecione a data do culto")
      return
    }

    setIsLoading(true)

    try {
      if (isRecurring) {
        // Create recurring template
        await createServiceTemplate({
          name: formData.name,
          type: formData.type as any,
          time: formData.time,
          dayOfWeek: parseInt(formData.dayOfWeek),
          isRecurring: true,
          isActive: true,
          observations: formData.observations || undefined,
        })
        toast.success("Culto recorrente criado! Agora clique em 'Gerar Próximas Semanas' para criar os cultos.")
        router.push("/cultos")
      } else {
        // Create single service
        const newService = await createService({
          name: formData.name,
          type: formData.type as any,
          date: date!,
          time: formData.time,
          status: "agendado",
          observations: formData.observations || undefined,
        })
        console.log("Culto criado:", newService)
        toast.success("Culto criado com sucesso!")
        router.push("/cultos")
      }
    } catch (error) {
      console.error("Error creating service:", error)
      toast.error("Erro ao criar culto. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Novo Culto" }]}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Novo Culto</h1>
          <p className="text-muted-foreground">Cadastre um novo culto</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Culto</CardTitle>
            <CardDescription>Preencha os dados para criar um novo culto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring">Culto Recorrente</Label>
                  <p className="text-sm text-muted-foreground">
                    O culto será criado automaticamente toda semana
                  </p>
                </div>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Culto</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Culto da Família"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isRecurring ? (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                    <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOfWeekOptions.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações sobre o culto..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    isRecurring ? "Criar Culto Recorrente" : "Criar Culto"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
