"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Upload, Church } from "lucide-react"
import { incomeTypes, paymentMethods, serviceTypes } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { IncomeType, PaymentMethod, Service } from "@/lib/types"
import { getServices, getService, updateService, createServiceIncome } from "@/lib/services/services"
import { toast } from "sonner"

interface IncomeEntry {
  id: string
  type: IncomeType
  amount: number
  paymentMethod: PaymentMethod
  observations?: string
}

const steps = [
  { id: 1, name: "Selecionar Culto" },
  { id: 2, name: "Lançar Entradas" },
  { id: 3, name: "Revisar e Finalizar" },
]

export default function FechamentoCultoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedId = searchParams.get("id")

  const [currentStep, setCurrentStep] = useState(preSelectedId ? 2 : 1)
  const [selectedService, setSelectedService] = useState(preSelectedId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [pendingServices, setPendingServices] = useState<Service[]>([])
  const [service, setService] = useState<Service | null>(null)
  const [observations, setObservations] = useState("")
  const [incomes, setIncomes] = useState<IncomeEntry[]>([
    { id: "1", type: "dizimo", amount: 0, paymentMethod: "dinheiro" },
    { id: "2", type: "oferta", amount: 0, paymentMethod: "dinheiro" },
  ])

  useEffect(() => {
    loadServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedService) loadService()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService])

  const loadServices = async () => {
    try {
      setIsLoadingServices(true)
      const allServices = await getServices()
      // Mostrar TODOS os cultos, ordenados por data (mais recentes primeiro)
      const sorted = allServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setPendingServices(sorted)
    } catch (error) {
      console.error("Error loading services:", error)
      toast.error("Erro ao carregar cultos")
    } finally {
      setIsLoadingServices(false)
    }
  }

  const loadService = async () => {
    try {
      const serviceData = await getService(selectedService)
      setService(serviceData)
    } catch (error) {
      console.error("Error loading service:", error)
      toast.error("Erro ao carregar culto")
    }
  }

  const addIncome = () => {
    setIncomes([
      ...incomes,
      {
        id: Date.now().toString(),
        type: "oferta",
        amount: 0,
        paymentMethod: "dinheiro",
      },
    ])
  }

  const removeIncome = (id: string) => {
    setIncomes(incomes.filter((i) => i.id !== id))
  }

  const updateIncome = (id: string, field: keyof IncomeEntry, value: string | number) => {
    setIncomes(incomes.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  // ===== Helpers robustos: não dependem do value exato do constants =====
  const norm = (s?: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

  const getPaymentLabel = (value: string) => paymentMethods.find((m) => m.value === value)?.label || value
  const getTypeLabel = (value: string) => incomeTypes.find((t) => t.value === value)?.label || value

  const isPix = (paymentMethod: string) => {
    const v = norm(paymentMethod)
    const l = norm(getPaymentLabel(paymentMethod))
    return v.includes("pix") || l.includes("pix")
  }

  const isCash = (paymentMethod: string) => {
    const v = norm(paymentMethod)
    const l = norm(getPaymentLabel(paymentMethod))
    return v.includes("dinheiro") || l.includes("dinheiro") || v.includes("cash") || l.includes("cash")
  }

  const isCoin = (paymentMethod: string) => {
    const v = norm(paymentMethod)
    const l = norm(getPaymentLabel(paymentMethod))
    return v.includes("moeda") || l.includes("moeda") || v.includes("coin") || l.includes("coin")
  }

  const isDizimo = (type: string) => {
    const v = norm(type)
    const l = norm(getTypeLabel(type))
    return v.includes("dizimo") || l.includes("dizimo")
  }

  const isOferta = (type: string) => {
    const v = norm(type)
    const l = norm(getTypeLabel(type))
    return v.includes("oferta") || l.includes("oferta")
  }

  // ===== Totais (por forma e por tipo) =====
  const validIncomes = useMemo(() => incomes.filter((i) => (i.amount || 0) > 0), [incomes])

  const totalAmount = useMemo(() => validIncomes.reduce((sum, i) => sum + (i.amount || 0), 0), [validIncomes])

  const pixTotal = useMemo(
    () => validIncomes.filter((i) => isPix(i.paymentMethod)).reduce((sum, i) => sum + (i.amount || 0), 0),
    [validIncomes]
  )

  const cashTotal = useMemo(
    () => validIncomes.filter((i) => isCash(i.paymentMethod)).reduce((sum, i) => sum + (i.amount || 0), 0),
    [validIncomes]
  )

  const coinsTotal = useMemo(
    () => validIncomes.filter((i) => isCoin(i.paymentMethod)).reduce((sum, i) => sum + (i.amount || 0), 0),
    [validIncomes]
  )

  const dizimoTotal = useMemo(
    () => validIncomes.filter((i) => isDizimo(i.type)).reduce((sum, i) => sum + (i.amount || 0), 0),
    [validIncomes]
  )

  const ofertaTotal = useMemo(
    () => validIncomes.filter((i) => isOferta(i.type)).reduce((sum, i) => sum + (i.amount || 0), 0),
    [validIncomes]
  )

  // ===== Totais gerais para mostrar "Outros" (opcional) =====
  const totalsByPayment = useMemo(() => {
    return validIncomes.reduce<Record<string, number>>((acc, i) => {
      const key = i.paymentMethod
      acc[key] = (acc[key] || 0) + (i.amount || 0)
      return acc
    }, {})
  }, [validIncomes])

  const totalsByType = useMemo(() => {
    return validIncomes.reduce<Record<string, number>>((acc, i) => {
      const key = i.type
      acc[key] = (acc[key] || 0) + (i.amount || 0)
      return acc
    }, {})
  }, [validIncomes])

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleFinish = async () => {
    if (!service || !selectedService) {
      toast.error("Selecione um culto")
      return
    }

    // Evita duplicar fechamento
    if (service.status === "finalizado") {
      toast.error("Este culto já está finalizado.")
      return
    }

    if (validIncomes.length === 0) {
      toast.error("Adicione pelo menos uma entrada")
      return
    }

    setIsLoading(true)

    try {
      // Create all income entries
      for (const income of validIncomes) {
        await createServiceIncome({
          serviceId: selectedService,
          type: income.type,
          amount: income.amount,
          paymentMethod: income.paymentMethod,
          observations: income.observations,
        })
      }

      // Update service status and observations (+ totais do fechamento)
      // OBS: isso só vai persistir se seu backend aceitar esses campos no updateService.
      await updateService(
        selectedService,
        {
          status: "finalizado",
          observations: observations || service.observations,
          totalIncome: totalAmount,
          totalsByPayment: {
            pix: pixTotal,
            dinheiro: cashTotal,
            moeda: coinsTotal,
          },
          totalsByType: {
            dizimo: dizimoTotal,
            oferta: ofertaTotal,
          },
        } as any
      )

      toast.success("Fechamento realizado com sucesso!")
      router.push(`/cultos/${selectedService}`)
    } catch (error) {
      console.error("Error finishing service:", error)
      toast.error("Erro ao finalizar fechamento")
      setIsLoading(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Fechamento de Culto" }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Registrar Arrecadação do Culto</h1>
          <p className="text-muted-foreground">Informe quanto foi arrecadado no culto em 3 passos simples</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span
                  className={`ml-2 text-sm font-medium hidden sm:inline ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="mt-4" />
        </div>

        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Culto</CardTitle>
              <CardDescription>Escolha o culto para registrar a arrecadação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingServices ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Carregando cultos...</p>
                </div>
              ) : pendingServices.length === 0 ? (
                <div className="text-center py-8">
                  <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum culto encontrado</p>
                  <Button className="mt-4" onClick={() => router.push("/cultos/novo")}>
                    Criar Novo Culto
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Navegação/Carrossel de Cultos */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {pendingServices.length} {pendingServices.length === 1 ? "culto encontrado" : "cultos encontrados"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentIndex = pendingServices.findIndex((s) => s.id === selectedService)
                          if (currentIndex > 0) {
                            setSelectedService(pendingServices[currentIndex - 1].id)
                          }
                        }}
                        disabled={!selectedService || pendingServices.findIndex((s) => s.id === selectedService) === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentIndex = pendingServices.findIndex((s) => s.id === selectedService)
                          if (currentIndex < pendingServices.length - 1) {
                            setSelectedService(pendingServices[currentIndex + 1].id)
                          }
                        }}
                        disabled={
                          !selectedService ||
                          pendingServices.findIndex((s) => s.id === selectedService) === pendingServices.length - 1
                        }
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Cultos */}
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {pendingServices.map((s) => {
                      const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
                        agendado: { label: "Agendado", variant: "outline" },
                        em_andamento: { label: "Em Andamento", variant: "secondary" },
                        finalizado: { label: "Finalizado", variant: "default" },
                      }
                      const status = statusConfig[s.status] || { label: s.status, variant: "outline" as const }

                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedService === s.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedService(s.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                selectedService === s.id ? "border-primary bg-primary" : "border-muted"
                              }`}
                            />
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(s.date)} às {s.time}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <Badge variant="outline">{serviceTypes.find((t) => t.value === s.type)?.label || s.type}</Badge>
                            {s.totalIncome > 0 && (
                              <Badge variant="secondary" className="text-emerald-600">
                                {formatCurrency(s.totalIncome)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleNext} disabled={!selectedService}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Enter Incomes */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lançar Entradas</CardTitle>
                  <CardDescription>
                    {service?.name} - {service && formatDate(service.date)} às {service?.time}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Total: {formatCurrency(totalAmount)}
                </Badge>
              </div>

              {/* Resumo rápido */}
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Por forma de pagamento</p>
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span>Pix</span>
                      <span className="font-medium">{formatCurrency(pixTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dinheiro</span>
                      <span className="font-medium">{formatCurrency(cashTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moeda</span>
                      <span className="font-medium">{formatCurrency(coinsTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Por tipo</p>
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span>Dízimo</span>
                      <span className="font-medium">{formatCurrency(dizimoTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Oferta</span>
                      <span className="font-medium">{formatCurrency(ofertaTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {incomes.map((income, index) => (
                <div key={income.id} className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-muted-foreground">Entrada {index + 1}</span>
                    {incomes.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeIncome(income.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={income.type} onValueChange={(value) => updateIncome(income.id, "type", value as IncomeType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {incomeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={income.amount || ""}
                        onChange={(e) => updateIncome(income.id, "amount", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={income.paymentMethod}
                        onValueChange={(value) => updateIncome(income.id, "paymentMethod", value as PaymentMethod)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    <Label>Observações (opcional)</Label>
                    <Input
                      placeholder="Ex: Campanha específica, doador identificado, etc."
                      value={income.observations || ""}
                      onChange={(e) => updateIncome(income.id, "observations", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full bg-transparent" onClick={addIncome}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Entrada
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label>Observações Gerais do Culto</Label>
                <Textarea
                  placeholder="Observações sobre o culto..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Anexar Comprovantes (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos ou clique para selecionar
                    <br />
                    <span className="text-xs">PDF, JPG, PNG até 5MB</span>
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleNext} disabled={totalAmount === 0}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Review and Finish */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Revisar e Finalizar</CardTitle>
              <CardDescription>Confira os dados antes de finalizar o fechamento</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Service Info */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Informações do Culto</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Culto:</span>
                    <span className="font-medium">{service?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span>
                      {service && formatDate(service.date)} às {service?.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{serviceTypes.find((t) => t.value === service?.type)?.label}</span>
                  </div>
                </div>
              </div>

              {/* Resumo pedido */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Por Forma de Pagamento</h4>
                  <div className="flex justify-between text-sm py-1">
                    <span>Pix</span>
                    <span className="font-medium">{formatCurrency(pixTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Dinheiro</span>
                    <span className="font-medium">{formatCurrency(cashTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Moeda</span>
                    <span className="font-medium">{formatCurrency(coinsTotal)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Por Tipo</h4>
                  <div className="flex justify-between text-sm py-1">
                    <span>Dízimo</span>
                    <span className="font-medium">{formatCurrency(dizimoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Oferta</span>
                    <span className="font-medium">{formatCurrency(ofertaTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Income Summary */}
              <div>
                <h3 className="font-medium mb-3">Resumo das Entradas</h3>
                <div className="rounded-lg border">
                  <div className="p-3 border-b bg-muted/50 grid grid-cols-3 text-sm font-medium">
                    <span>Tipo</span>
                    <span>Forma de Pagamento</span>
                    <span className="text-right">Valor</span>
                  </div>
                  {validIncomes.map((income) => (
                    <div key={income.id} className="p-3 border-b last:border-b-0 grid grid-cols-3 text-sm">
                      <span>{getTypeLabel(income.type)}</span>
                      <span>{getPaymentLabel(income.paymentMethod)}</span>
                      <span className="text-right font-medium">{formatCurrency(income.amount)}</span>
                    </div>
                  ))}
                  <div className="p-3 bg-muted/50 grid grid-cols-3 font-medium">
                    <span className="col-span-2">Total</span>
                    <span className="text-right text-lg text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Extras (opcional): totais gerais por tipo/forma */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Por Tipo (completo)</h4>
                  {incomeTypes.map((type) => {
                    const total = totalsByType[type.value] || 0
                    if (total === 0) return null
                    return (
                      <div key={type.value} className="flex justify-between text-sm py-1">
                        <span>{type.label}</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Por Forma (completo)</h4>
                  {paymentMethods.map((method) => {
                    const total = totalsByPayment[method.value] || 0
                    if (total === 0) return null
                    return (
                      <div key={method.value} className="flex justify-between text-sm py-1">
                        <span>{method.label}</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {observations && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                  <p className="text-sm">{observations}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleFinish} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Finalizar Fechamento
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
