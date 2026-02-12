"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import {
  getBillCategories,
  createBillCategory,
  updateBillCategory,
  deleteBillCategory,
  type BillCategory,
} from "@/lib/services/bill-categories"

export default function CategoriasPage() {
  const [categories, setCategories] = useState<BillCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BillCategory | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const data = await getBillCategories(true) // Inclui inativas
      setCategories(data)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      toast.error("Erro ao carregar categorias")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (category?: BillCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: "",
        description: "",
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingCategory(null)
    setFormData({
      name: "",
      description: "",
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Nome da categoria é obrigatório")
      return
    }

    try {
      if (editingCategory) {
        await updateBillCategory(editingCategory.id, formData)
        toast.success("Categoria atualizada com sucesso!")
      } else {
        await createBillCategory(formData)
        toast.success("Categoria criada com sucesso!")
      }
      handleCloseDialog()
      await loadCategories()
    } catch (error: any) {
      console.error("Erro ao salvar categoria:", error)
      toast.error(error.message || "Erro ao salvar categoria")
    }
  }

  const handleDelete = async (category: BillCategory) => {
    if (!confirm(`Tem certeza que deseja ${category.isActive ? 'desativar' : 'deletar'} a categoria "${category.name}"?`)) {
      return
    }

    try {
      await deleteBillCategory(category.id)
      toast.success(`Categoria ${category.isActive ? 'desativada' : 'deletada'} com sucesso!`)
      await loadCategories()
    } catch (error: any) {
      console.error("Erro ao deletar categoria:", error)
      toast.error(error.message || "Erro ao deletar categoria")
    }
  }

  const handleToggleActive = async (category: BillCategory) => {
    try {
      await updateBillCategory(category.id, { isActive: !category.isActive })
      toast.success(`Categoria ${!category.isActive ? 'ativada' : 'desativada'} com sucesso!`)
      await loadCategories()
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error("Erro ao atualizar categoria")
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Categorias" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias de Contas</h1>
            <p className="text-muted-foreground">Gerencie as categorias de despesas</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Lista de todas as categorias cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(category)}
                            title={category.isActive ? "Desativar" : "Ativar"}
                          >
                            {category.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Criar/Editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Atualize as informações da categoria"
                    : "Preencha os dados da nova categoria"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Aluguel, Luz, Água..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional da categoria..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Categoria ativa
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
