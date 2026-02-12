"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Eye, Edit, Wallet, Loader2 } from "lucide-react"
import { getEvents } from "@/lib/services/events"
import type { Event } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { toast } from "sonner"

const columns: ColumnDef<Event>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "startDate",
    header: "Data Início",
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    accessorKey: "endDate",
    header: "Data Fim",
    cell: ({ row }) => {
      const date = row.getValue("endDate") as Date | undefined
      return date ? formatDate(date) : "-"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
        planejado: "outline",
        em_andamento: "default",
        finalizado: "secondary",
        cancelado: "destructive",
      }
      const labels: Record<string, string> = {
        planejado: "Planejado",
        em_andamento: "Em Andamento",
        finalizado: "Finalizado",
        cancelado: "Cancelado",
      }
      return <Badge variant={variants[status]}>{labels[status]}</Badge>
    },
  },
  {
    accessorKey: "totalIncome",
    header: "Arrecadado",
    cell: ({ row }) => (
      <span className="text-emerald-600 font-medium">{formatCurrency(row.getValue("totalIncome"))}</span>
    ),
  },
  {
    accessorKey: "totalExpense",
    header: "Gasto",
    cell: ({ row }) => <span className="text-red-600 font-medium">{formatCurrency(row.getValue("totalExpense"))}</span>,
  },
  {
    id: "saldo",
    header: "Saldo",
    cell: ({ row }) => {
      const income = row.original.totalIncome
      const expense = row.original.totalExpense
      const balance = income - expense
      return (
        <span className={balance >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
          {formatCurrency(balance)}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const event = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/eventos/${event.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/eventos/${event.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/eventos/${event.id}/caixa`}>
                <Wallet className="mr-2 h-4 w-4" />
                Ver Caixa
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const data = await getEvents()
      setEvents(data)
    } catch (error) {
      console.error("Error loading events:", error)
      toast.error("Erro ao carregar eventos")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Eventos" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Eventos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
            <p className="text-muted-foreground">Gerencie eventos e campanhas da igreja</p>
          </div>
          <Button asChild>
            <Link href="/eventos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Link>
          </Button>
        </div>

        <DataTable columns={columns} data={events} searchKey="name" searchPlaceholder="Buscar eventos..." />
      </div>
    </AppLayout>
  )
}
