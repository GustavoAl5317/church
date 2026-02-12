"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Eye, Edit, Upload, Users, UserCheck, UserX, UserPlus, Loader2 } from "lucide-react"
import { getMembers } from "@/lib/services/members"
import type { Member } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"
import { toast } from "sonner"

const statusConfig = {
  ativo: { label: "Ativo", variant: "default" as const, color: "bg-emerald-500" },
  inativo: { label: "Inativo", variant: "secondary" as const, color: "bg-gray-500" },
  visitante: { label: "Visitante", variant: "outline" as const, color: "bg-blue-500" },
}

const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const member = row.original
      const initials = member.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{member.name}</p>
            {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => row.getValue("phone") || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig
      const config = statusConfig[status]
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: "ministries",
    header: "Ministérios",
    cell: ({ row }) => {
      const memberMinistries = row.getValue("ministries") as string[]
      if (memberMinistries.length === 0) return "-"
      return (
        <div className="flex flex-wrap gap-1">
          {memberMinistries.slice(0, 2).map((ministry) => (
            <Badge key={ministry} variant="secondary" className="text-xs">
              {ministry}
            </Badge>
          ))}
          {memberMinistries.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{memberMinistries.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "entryDate",
    header: "Membro desde",
    cell: ({ row }) => formatDate(row.getValue("entryDate")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/membros/${member.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/membros/${member.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function MembrosPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      const data = await getMembers()
      setMembers(data)
    } catch (error) {
      console.error("Error loading members:", error)
      toast.error("Erro ao carregar membros")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Membros" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  const activeMembers = members.filter((m) => m.status === "ativo")
  const inactiveMembers = members.filter((m) => m.status === "inativo")
  const visitors = members.filter((m) => m.status === "visitante")

  return (
    <AppLayout breadcrumbs={[{ label: "Membros" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Membros</h1>
            <p className="text-muted-foreground">Gerencie os membros e visitantes da igreja</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/membros/importar">
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/membros/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Membro
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">membros cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                {members.length > 0 ? ((activeMembers.length / members.length) * 100).toFixed(0) : 0}% do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                {members.length > 0 ? ((inactiveMembers.length / members.length) * 100).toFixed(0) : 0}% do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Visitantes</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{visitors.length}</div>
              <p className="text-xs text-muted-foreground">aguardando integração</p>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <DataTable columns={columns} data={members} searchKey="name" searchPlaceholder="Buscar membros..." />
      </div>
    </AppLayout>
  )
}
