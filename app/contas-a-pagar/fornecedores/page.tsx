"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react"
import { getSuppliers, createSupplier } from "@/lib/services/suppliers"
import type { Supplier } from "@/lib/types"
import { toast } from "sonner"

const supplierCategories = [
  "Imóveis",
  "Serviços Públicos",
  "Equipamentos",
  "Manutenção",
  "Serviços",
  "Materiais",
  "Outros",
]

const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => <Badge variant="secondary">{row.getValue("category")}</Badge>,
  },
  {
    accessorKey: "contact",
    header: "Contato",
    cell: ({ row }) => row.getValue("contact") || "-",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => row.getValue("phone") || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "-",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/contas-a-pagar/fornecedores/${supplier.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    contact: "",
    phone: "",
    email: "",
    observations: "",
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setIsLoadingData(true)
      const data = await getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error("Error loading suppliers:", error)
      toast.error("Erro ao carregar fornecedores")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome do fornecedor é obrigatório")
      return
    }

    try {
      setIsLoading(true)
      await createSupplier({
        name: formData.name.trim(),
        category: formData.category || "Outros",
        contact: formData.contact.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        observations: formData.observations.trim() || undefined,
      })
      toast.success("Fornecedor cadastrado com sucesso!")
      setDialogOpen(false)
      setFormData({
        name: "",
        category: "",
        contact: "",
        phone: "",
        email: "",
        observations: "",
      })
      await loadSuppliers()
    } catch (error) {
      console.error("Error creating supplier:", error)
      toast.error("Erro ao cadastrar fornecedor")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Fornecedores" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Contas a Pagar", href: "/contas-a-pagar" }, { label: "Fornecedores" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
            <p className="text-muted-foreground">Gerencie os fornecedores e prestadores de serviço</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Fornecedor</DialogTitle>
                <DialogDescription>Cadastre um novo fornecedor ou prestador de serviço</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome do fornecedor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contato</Label>
                    <Input
                      id="contact"
                      placeholder="Nome do contato"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@fornecedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    placeholder="Observações..."
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading || !formData.name}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable columns={columns} data={suppliers} searchKey="name" searchPlaceholder="Buscar fornecedores..." />
      </div>
    </AppLayout>
  )
}
