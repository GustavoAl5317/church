"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Loader2, Upload, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { paymentMethods, billCategories } from "@/lib/constants"
import { getCashBoxes, createCashTransaction } from "@/lib/services/cash"
import type { CashBox } from "@/lib/types"
import { toast } from "sonner"

const incomeCategories = [
  { value: "culto", label: "Culto" },
  { value: "doacao", label: "Doação" },
  { value: "evento", label: "Evento" },
  { value: "transferencia", label: "Transferência" },
  { value: "outros", label: "Outros" },
]

function NovaMovimentacaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get("tipo") || "entrada"

  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([])
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState<"entrada" | "saida">(initialType as "entrada" | "saida")
  const [date, setDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    cashBoxId: "",
    category: "",
    description: "",
    amount: "",
    paymentMethod: "",
    observations: "",
  })

  useEffect(() => {
    loadCashBoxes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCashBoxes = async () => {
    try {
      setIsLoadingBoxes(true)
      const data = await getCashBoxes()
      setCashBoxes(data)

      // Set default to general cash box
      const generalBox = data.find((c) => c.type === "geral")
      if (generalBox) {
        setFormData((prev) => ({ ...prev, cashBoxId: generalBox.id }))
      }
    } catch (error) {
      console.error("Error loading cash boxes:", error)
      toast.error("Erro ao carregar caixas")
    } finally {
      setIsLoadingBoxes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cashBoxId || !formData.category || !formData.description || !formData.amount || !formData.paymentMethod) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const amountNumber = Number.parseFloat(formData.amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error("Informe um valor válido (maior que zero)")
      return
    }

    // ✅ CORREÇÃO: sempre enviar valor POSITIVO.
    // O sistema deve aplicar +/− usando o campo `type` (entrada/saida).
    const amount = Math.abs(amountNumber)

    setIsLoading(true)
    try {
      await createCashTransaction({
        cashBoxId: formData.cashBoxId,
        type,
        category: formData.category,
        description: formData.description,
        amount, // ✅ sempre positivo
        paymentMethod: formData.paymentMethod as any,
        date,
        responsibleId: "system",
        responsibleName: "Sistema",
        observations: formData.observations || undefined,
      })

      toast.success(`${type === "entrada" ? "Entrada" : "Saída"} registrada com sucesso!`)

      // Disparar evento para atualizar o dashboard e caixa
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dashboard:refresh"))
        window.dispatchEvent(new CustomEvent("cash:refresh"))
      }

      router.push("/caixa")
    } catch (error: any) {
      console.error("Error creating transaction:", error)
      toast.error(error?.message || `Erro ao registrar ${type === "entrada" ? "entrada" : "saída"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const categories = type === "entrada" ? incomeCategories : billCategories

  return (
    <AppLayout breadcrumbs={[{ label: "Caixa", href: "/caixa" }, { label: "Nova Movimentação" }]}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Nova Movimentação</h1>
          <p className="text-muted-foreground">Registre uma nova entrada ou saída no caixa</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs
              value={type}
              onValueChange={(v) => {
                // ao trocar tipo, zerar categoria para evitar categoria inválida
                setType(v as "entrada" | "saida")
                setFormData((prev) => ({ ...prev, category: "" }))
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrada" className="gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  Entrada
                </TabsTrigger>
                <TabsTrigger value="saida" className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Saída
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cashBox">Caixa</Label>
                  <Select
                    value={formData.cashBoxId}
                    onValueChange={(value) => setFormData({ ...formData, cashBoxId: value })}
                    disabled={isLoadingBoxes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingBoxes ? "Carregando..." : "Selecione o caixa"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cashBoxes.map((box) => (
                        <SelectItem key={box.id} value={box.id}>
                          {box.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")} type="button">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
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

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder={type === "entrada" ? "Ex: Entradas do Culto Dominical" : "Ex: Pagamento de aluguel"}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

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
                <Label>Anexar Comprovante (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Arraste arquivos ou clique para selecionar</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={type === "entrada" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      {type === "entrada" ? <ArrowDownLeft className="mr-2 h-4 w-4" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
                      Registrar {type === "entrada" ? "Entrada" : "Saída"}
                    </>
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

export default function NovaMovimentacaoPage() {
  return (
    <Suspense fallback={null}>
      <NovaMovimentacaoContent />
    </Suspense>
  )
}
