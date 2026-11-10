"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Loader2, Search, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { deleteEvent, getEvents, updateEvent } from "@/lib/services/events"
import { eventStatusLabels, eventTypeLabels } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import type { Event } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"

const typeBadgeClass: Record<Event["type"], string> = {
  culto: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  reuniao: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  retiro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  conferencia: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  outro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function occupancy(event: Event) {
  if (!event.capacity) return null
  return Math.round((event.attendance / event.capacity) * 100)
}

export default function EventosPage() {
  const { can } = useAuth()
  const canManage = can("eventos", "manage")
  const canSeeFinance = can("caixa")
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [toDelete, setToDelete] = useState<Event | null>(null)
  const [attendanceFor, setAttendanceFor] = useState<Event | null>(null)
  const [attendanceValue, setAttendanceValue] = useState("")
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((error) => {
        console.error("Erro ao carregar eventos:", error)
        toast.error("Erro ao carregar eventos")
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Próximos eventos primeiro (do mais perto ao mais longe), depois os passados (do mais recente)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const today = startOfToday()
    const list = events.filter((e) => {
      if (typeFilter !== "todos" && e.type !== typeFilter) return false
      if (!term) return true
      return [e.name, e.description ?? "", e.location ?? ""].some((f) => f.toLowerCase().includes(term))
    })
    const upcoming = list.filter((e) => e.startDate >= today).sort((a, b) => +a.startDate - +b.startDate)
    const past = list.filter((e) => e.startDate < today).sort((a, b) => +b.startDate - +a.startDate)
    return [...upcoming, ...past]
  }, [events, search, typeFilter])

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteEvent(toDelete.id)
      setEvents((prev) => prev.filter((e) => e.id !== toDelete.id))
      toast.success("Evento removido")
    } catch (error) {
      console.error("Erro ao remover evento:", error)
      toast.error("Erro ao remover evento")
    }
  }

  const openAttendance = (event: Event) => {
    setAttendanceFor(event)
    setAttendanceValue(String(event.attendance))
  }

  const saveAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceFor) return
    const value = Number(attendanceValue)
    if (!Number.isInteger(value) || value < 0) {
      toast.error("Informe um número inteiro de pessoas.")
      return
    }
    setIsSavingAttendance(true)
    try {
      const updated = await updateEvent(attendanceFor.id, { attendance: value })
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)))
      toast.success("Presença registrada")
      setAttendanceFor(null)
    } catch (error) {
      console.error("Erro ao registrar presença:", error)
      toast.error("Erro ao registrar presença")
    } finally {
      setIsSavingAttendance(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Eventos" }]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
            <p className="text-muted-foreground">Total: {filtered.length}</p>
          </div>
          {canManage && (
            <Button asChild>
              <Link href="/eventos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição ou local..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {events.length === 0 ? "Nenhum evento cadastrado ainda." : "Nenhum evento encontrado com esses filtros."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((event) => {
              const rate = occupancy(event)
              return (
                <Card key={event.id} className="gap-4">
                  <CardContent className="flex gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{event.name}</h2>
                        <Badge variant="outline" className={`border-0 ${typeBadgeClass[event.type]}`}>
                          {eventTypeLabels[event.type]}
                        </Badge>
                        <Badge variant={event.status === "cancelado" ? "destructive" : "secondary"}>
                          {eventStatusLabels[event.status]}
                        </Badge>
                      </div>
                      {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Data</p>
                          <p>
                            {formatDate(event.startDate)}
                            {event.startTime && ` às ${event.startTime}`}
                            {event.endDate && ` até ${formatDate(event.endDate)}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Local</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {event.location || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Presença</p>
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {event.attendance}
                            {event.capacity ? ` / ${event.capacity}` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Taxa de ocupação</p>
                          <p>{rate === null ? "-" : `${rate}%`}</p>
                        </div>
                      </div>
                      {canSeeFinance && event.cashBoxId && (
                        <p className="text-sm text-muted-foreground">
                          Arrecadado <span className="text-emerald-600">{formatCurrency(event.totalIncome)}</span> ·
                          Gasto <span className="text-red-600">{formatCurrency(event.totalExpense)}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <span className="text-[10px] uppercase">{formatDate(event.startDate, "EEE")}</span>
                      <span className="text-2xl font-bold leading-none">{formatDate(event.startDate, "dd")}</span>
                      <span className="text-[10px] uppercase">{formatDate(event.startDate, "MMM")}</span>
                    </div>
                  </CardContent>
                  {canManage && (
                    <CardFooter className="grid grid-cols-3 border-t pt-4">
                      <Button variant="ghost" className="text-primary" asChild>
                        <Link href={`/eventos/${event.id}/editar`}>Editar</Link>
                      </Button>
                      <Button variant="ghost" onClick={() => openAttendance(event)}>
                        Registrar presença
                      </Button>
                      <Button variant="ghost" className="text-destructive" onClick={() => setToDelete(event)}>
                        Remover
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!attendanceFor} onOpenChange={(open) => !open && setAttendanceFor(null)}>
        <DialogContent>
          <form onSubmit={saveAttendance} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Registrar presença</DialogTitle>
              <DialogDescription>{attendanceFor?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="attendance">Número de pessoas presentes</Label>
              <Input
                id="attendance"
                type="number"
                min="0"
                step="1"
                value={attendanceValue}
                onChange={(e) => setAttendanceValue(e.target.value)}
                autoFocus
              />
              {attendanceFor?.capacity ? (
                <p className="text-xs text-muted-foreground">Capacidade: {attendanceFor.capacity} lugares</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAttendanceFor(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingAttendance}>
                {isSavingAttendance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remover evento?"
        description={
          <>
            O evento <strong>{toDelete?.name}</strong> será apagado. Esta ação não pode ser desfeita.
          </>
        }
        onConfirm={handleDelete}
      />
    </AppLayout>
  )
}
