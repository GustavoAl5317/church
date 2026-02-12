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
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Loader2, AlertCircle, ArrowRightLeft } from "lucide-react"
import { getCashBoxes } from "@/lib/services/cash"
import type { CashBox } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"
import { toast } from "sonner"

export default function TransferenciasPage() {
  const router = useRouter()
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([])
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fromCashBox: "",
    toCashBox: "",
    amount: "",
    description: "",
    observations: "",
  })

  useEffect(() => {
    loadCashBoxes()
  }, [])

  const loadCashBoxes = async () => {
    try {
      setIsLoadingBoxes(true)
      const data = await getCashBoxes()
      setCashBoxes(data)
    } catch (error) {
      console.error("Error loading cash boxes:", error)
      toast.error("Erro ao carregar caixas")
    } finally {
      setIsLoadingBoxes(false)
    }
  }

  const fromBox = cashBoxes.find((b) => b.id === formData.fromCashBox)
  const toBox = cashBoxes.find((b) => b.id === formData.toCashBox)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/caixa")
  }

  const amount = Number.parseFloat(formData.amount) || 0
  const insufficientFunds = fromBox && amount > fromBox.balance

  if (isLoadingBoxes) {
    return (
      <AppLayout breadcrumbs={[{ label: "Caixa", href: "/caixa" }, { label: "Transferências" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Caixa", href: "/caixa" }, { label: "Transferências" }]}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Transferência entre Caixas</h1>
          <p className="text-muted-foreground">Movimente valores entre o caixa geral e caixas de eventos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Nova Transferência
            </CardTitle>
            <CardDescription>
              Transferências geram dois registros vinculados: débito na origem e crédito no destino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[1fr,auto,1fr]">
                {/* From Cash Box */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Caixa de Origem</Label>
                    <Select
                      value={formData.fromCashBox}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          fromCashBox: value,
                          toCashBox: formData.toCashBox === value ? "" : formData.toCashBox,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
                  {fromBox && (
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Saldo disponível</p>
                      <p className="text-lg font-bold">{formatCurrency(fromBox.balance)}</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* To Cash Box */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Caixa de Destino</Label>
                    <Select
                      value={formData.toCashBox}
                      onValueChange={(value) => setFormData({ ...formData, toCashBox: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashBoxes
                          .filter((box) => box.id !== formData.fromCashBox)
                          .map((box) => (
                            <SelectItem key={box.id} value={box.id}>
                              {box.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {toBox && (
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Saldo atual</p>
                      <p className="text-lg font-bold">{formatCurrency(toBox.balance)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="amount">Valor da Transferência</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="pl-10 text-lg"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              {insufficientFunds && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Saldo insuficiente. O caixa de origem possui apenas {formatCurrency(fromBox?.balance || 0)}.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Transferência para campanha do agasalho"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
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

              {/* Preview */}
              {fromBox && toBox && amount > 0 && !insufficientFunds && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Prévia da transferência:</p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{fromBox.name} (novo saldo):</span>
                      <span className="font-medium text-red-600">{formatCurrency(fromBox.balance - amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{toBox.name} (novo saldo):</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(toBox.balance + amount)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || insufficientFunds || !formData.fromCashBox || !formData.toCashBox}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Realizar Transferência
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
