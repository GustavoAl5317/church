"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Upload } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { paymentMethods } from "@/lib/constants"
import { getSuppliers } from "@/lib/services/suppliers"
import { getEvents } from "@/lib/services/events"
import { getBillCategories } from "@/lib/services/bill-categories"
import { createBillPayable, generateRecurringBills } from "@/lib/services/bills"
import type { Supplier, Event, BillPayable } from "@/lib/types"
import type { BillCategory as BillCategoryType } from "@/lib/services/bill-categories"
import { toast } from "sonner"

const recurrenceOptions = [
  { value: "unica", label: "Pagamento único" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
]

export default function NovaContaPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<BillCategoryType[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [dueDate, setDueDate] = useState<Date>()
  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    description: "",
    amount: "",
    category: "",
    recurrence: "unica",
    costCenter: "geral",
    eventId: "",
    paymentMethod: "",
    observations: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoadingData(true)
      const [suppliersData, eventsData, categoriesData] = await Promise.all([
        getSuppliers(),
        getEvents(),
        getBillCategories(),
      ])
      setSuppliers(suppliersData)
      setEvents(eventsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dueDate) {
      toast.error("Selecione a data de vencimento")
      return
    }
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsLoading(true)

    try {
      const billData: Omit<BillPayable, 'id' | 'createdAt' | 'updatedAt'> = {
        supplierId: formData.supplierId || undefined,
        supplierName: formData.supplierName || undefined,
        description: formData.description,
        amount: parseFloat(formData.amount),
        dueDate: dueDate,
        recurrence: formData.recurrence === "unica" ? undefined : (formData.recurrence as BillPayable['recurrence']),
        category: formData.category as BillPayable['category'],
        costCenter: formData.costCenter as BillPayable['costCenter'],
        eventId: formData.eventId || undefined,
        paymentMethod: formData.paymentMethod ? (formData.paymentMethod as BillPayable['paymentMethod']) : undefined,
        status: "pendente",
        observations: formData.observations || undefined,
      }

      // Cria a conta principal
      const createdBill = await createBillPayable(billData)

      // Se for recorrente, gera as próximas contas
      if (formData.recurrence !== "unica") {
        await generateRecurringBills(createdBill.id, 12) // Gera 12 meses/anos/semanas à frente
        toast.success(`Conta criada! ${formData.recurrence === "mensal" ? "12 meses" : formData.recurrence === "semanal" ? "12 semanas" : "12 anos"} de contas geradas automaticamente.`)
      } else {
        toast.success("Conta criada com sucesso!")
      }

      router.push("/contas-a-pagar")
    } catch (error) {
      console.error("Erro ao criar conta:", error)
      toast.error("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Despesas", href: "/contas-a-pagar" }, { label: "Nova Despesa" }]}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Nova Despesa</h1>
          <p className="text-muted-foreground">Cadastre uma nova despesa</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Preencha os dados da despesa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => {
                      const supplier = suppliers.find((s) => s.id === value)
                      setFormData({
                        ...formData,
                        supplierId: value,
                        supplierName: supplier?.name || "",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou deixe em branco" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Categoria</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => router.push("/contas-a-pagar/categorias")}
                    >
                      Gerenciar Categorias
                    </Button>
                  </div>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhuma categoria disponível
                        </div>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Conta de luz - Janeiro/2025"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="pl-10"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recorrência</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.recurrence !== "unica" && (
                    <p className="text-xs text-muted-foreground">
                      {formData.recurrence === "mensal" && "Serão geradas automaticamente 12 contas mensais"}
                      {formData.recurrence === "semanal" && "Serão geradas automaticamente 12 contas semanais"}
                      {formData.recurrence === "anual" && "Serão geradas automaticamente 12 contas anuais"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento Prevista</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="costCenter">Centro de Custo</Label>
                  <Select
                    value={formData.costCenter}
                    onValueChange={(value) => setFormData({ ...formData, costCenter: value, eventId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Caixa Geral</SelectItem>
                      <SelectItem value="evento">Evento/Campanha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.costCenter === "evento" && (
                  <div className="space-y-2">
                    <Label htmlFor="event">Evento</Label>
                    <Select
                      value={formData.eventId}
                      onValueChange={(value) => setFormData({ ...formData, eventId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Anexos (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos ou clique para selecionar
                    <br />
                    <span className="text-xs">Boletos, notas fiscais, etc.</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
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
                    "Criar Conta"
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
