"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { eventStatusLabels, eventTypeLabels } from "@/lib/constants"
import type { EventInput } from "@/lib/services/events"
import type { Event, EventStatus, EventType } from "@/lib/types"

export interface EventFormResult {
  data: EventInput
  createCashBox: boolean
}

interface EventFormProps {
  initial?: Event
  submitLabel: string
  onSubmit: (result: EventFormResult) => Promise<void>
}

function DateField({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string
  value?: Date
  onChange: (date?: Date) => void
  minDate?: Date
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: ptBR }) : "Selecione"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            defaultMonth={value}
            locale={ptBR}
            disabled={minDate ? (date) => date < minDate : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function EventForm({ initial, submitLabel, onSubmit }: EventFormProps) {
  const router = useRouter()
  const isNew = !initial
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState(initial?.name ?? "")
  const [type, setType] = useState<EventType>(initial?.type ?? "culto")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [startDate, setStartDate] = useState<Date | undefined>(initial?.startDate)
  const [startTime, setStartTime] = useState(initial?.startTime ?? "")
  const [endDate, setEndDate] = useState<Date | undefined>(initial?.endDate)
  const [location, setLocation] = useState(initial?.location ?? "")
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "")
  const [attendance, setAttendance] = useState(initial?.attendance?.toString() ?? "0")
  const [status, setStatus] = useState<EventStatus>(initial?.status ?? "planejado")
  const [createCashBox, setCreateCashBox] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!startDate) {
      setError("Informe a data do evento.")
      return
    }
    if (endDate && endDate < startDate) {
      setError("A data de término não pode ser antes do início.")
      return
    }
    const capacityValue = capacity.trim() === "" ? undefined : Number(capacity)
    const attendanceValue = Number(attendance || 0)
    if (capacityValue !== undefined && (!Number.isInteger(capacityValue) || capacityValue < 0)) {
      setError("A capacidade deve ser um número inteiro.")
      return
    }
    if (!Number.isInteger(attendanceValue) || attendanceValue < 0) {
      setError("A presença deve ser um número inteiro.")
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({
        createCashBox,
        data: {
          name,
          type,
          description,
          startDate,
          startTime: startTime || undefined,
          endDate,
          location,
          capacity: capacityValue,
          attendance: attendanceValue,
          status,
          cashBoxId: initial?.cashBoxId,
          observations: initial?.observations,
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do evento *</Label>
          <Input
            id="name"
            placeholder="Ex: Culto de Domingo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as EventType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o evento..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DateField label="Data *" value={startDate} onChange={setStartDate} />
        <div className="space-y-2">
          <Label htmlFor="startTime">Horário</Label>
          <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <DateField label="Término (opcional)" value={endDate} onChange={setEndDate} minDate={startDate} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Local</Label>
          <Input
            id="location"
            placeholder="Ex: Templo Principal"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(eventStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacidade (lugares)</Label>
          <Input
            id="capacity"
            type="number"
            min="0"
            step="1"
            placeholder="Ex: 200"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendance">Presença registrada</Label>
          <Input
            id="attendance"
            type="number"
            min="0"
            step="1"
            value={attendance}
            onChange={(e) => setAttendance(e.target.value)}
          />
        </div>
      </div>

      {isNew && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="cashBox">Criar caixa do evento</Label>
            <p className="text-sm text-muted-foreground">
              Um caixa separado para controlar as entradas e saídas do evento
            </p>
          </div>
          <Switch id="cashBox" checked={createCashBox} onCheckedChange={setCreateCashBox} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
