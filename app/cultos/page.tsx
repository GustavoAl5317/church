"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { AppLayout } from "@/components/layout/app-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, MoreHorizontal, Eye, Edit, FileText, CheckCircle, RefreshCw, Loader2, Calendar, Star,
  ChevronLeft, ChevronRight, Trash2, Clock, Church
} from "lucide-react"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isToday, differenceInDays } from "date-fns"
import { serviceTypes, incomeTypes, paymentMethods } from "@/lib/constants"
import type { Service, ServiceTemplate, IncomeType, PaymentMethod } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { 
  getServices, generateWeeklyServices, getServiceTemplates, getService, updateService, 
  createServiceIncome, createServiceTemplate, updateServiceTemplate, deleteServiceTemplate 
} from "@/lib/services/services"
import { toast } from "sonner"

const dayNames = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
]

const steps = [
  { id: 1, name: "Selecionar Culto" },
  { id: 2, name: "Lançar Entradas" },
  { id: 3, name: "Revisar e Finalizar" },
]

interface IncomeEntry {
  id: string
  type: IncomeType
  amount: number
  paymentMethod: PaymentMethod
  observations?: string
}

const createColumns = (nextCulto?: Service): ColumnDef<Service>[] => [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => {
      const service = row.original
      const serviceDate = new Date(service.date)
      const isNext = nextCulto && service.id === nextCulto.id
      
      return (
        <div className="flex items-center gap-2">
          {isNext && <Star className="h-4 w-4 text-primary fill-primary" />}
          <span>{formatDate(serviceDate)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "time",
    header: "Horário",
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = serviceTypes.find((t) => t.value === row.getValue("type"))
      return type?.label || row.getValue("type")
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variants: Record<string, "default" | "secondary" | "outline"> = {
        agendado: "outline",
        em_andamento: "secondary",
        finalizado: "default",
      }
      const labels: Record<string, string> = {
        agendado: "Agendado",
        em_andamento: "Em Andamento",
        finalizado: "Finalizado",
      }
      return <Badge variant={variants[status]}>{labels[status]}</Badge>
    },
  },
  {
    accessorKey: "totalIncome",
    header: "Arrecadado",
    cell: ({ row }) => {
      const value = row.getValue("totalIncome") as number | undefined
      const service = row.original
      if (value && value > 0) {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-emerald-600">{formatCurrency(value)}</span>
            {service.status === "agendado" && (
              <span className="text-xs text-muted-foreground">Aguardando registro</span>
            )}
          </div>
        )
      }
      return (
        <span className="text-muted-foreground">
          {service.status === "finalizado" ? "R$ 0,00" : "Não registrado"}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const service = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/cultos/${service.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Link>
            </DropdownMenuItem>
            {service.status === "agendado" && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/cultos/${service.id}/editar`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function CultosPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "lista"
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [services, setServices] = useState<Service[]>([])
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Fechamento state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState("")
  const [pendingServices, setPendingServices] = useState<Service[]>([])
  const [service, setService] = useState<Service | null>(null)
  const [incomes, setIncomes] = useState<IncomeEntry[]>([
    { id: "1", type: "dizimo", amount: 0, paymentMethod: "dinheiro" },
    { id: "2", type: "oferta", amount: 0, paymentMethod: "dinheiro" },
  ])
  
  // Configurar state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "",
    dayOfWeek: "",
    time: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadServices()
    if (activeTab === "configurar") {
      loadTemplates()
    }
    if (activeTab === "fechamento") {
      loadAllServices()
    }
  }, [activeTab])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      
      const [data, templatesData] = await Promise.all([
        getServices(startOfDay(monthStart), endOfDay(monthEnd)),
        getServiceTemplates().catch(() => [])
      ])
      
      setServices(data)
      setTemplates(templatesData as ServiceTemplate[])
    } catch (error) {
      console.error("Error loading services:", error)
      toast.error("Erro ao carregar cultos")
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllServices = async () => {
    try {
      const allServices = await getServices()
      const sorted = allServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setPendingServices(sorted)
      
      const preSelectedId = searchParams.get("id")
      if (preSelectedId) {
        setSelectedService(preSelectedId)
        setCurrentStep(2)
      }
    } catch (error) {
      console.error("Error loading services:", error)
      toast.error("Erro ao carregar cultos")
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await getServiceTemplates()
      setTemplates(data)
    } catch (error) {
      console.error("Error loading templates:", error)
      toast.error("Erro ao carregar templates")
    }
  }

  useEffect(() => {
    if (selectedService && activeTab === "fechamento") {
      loadService()
    }
  }, [selectedService, activeTab])

  const loadService = async () => {
    try {
      const serviceData = await getService(selectedService)
      setService(serviceData)
    } catch (error) {
      console.error("Error loading service:", error)
      toast.error("Erro ao carregar culto")
    }
  }

  const handleGenerateWeekly = async () => {
    try {
      setIsGenerating(true)
      const newServices = await generateWeeklyServices(4)
      toast.success(`${newServices.length} cultos gerados com sucesso!`)
      await loadServices()
    } catch (error) {
      console.error("Error generating services:", error)
      toast.error("Erro ao gerar cultos semanais")
    } finally {
      setIsGenerating(false)
    }
  }

  // Fechamento handlers
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

  const totalAmount = incomes.reduce((sum, i) => sum + (i.amount || 0), 0)

  const handleFinish = async () => {
    if (!service || !selectedService) {
      toast.error("Selecione um culto")
      return
    }

    const validIncomes = incomes.filter((i) => i.amount > 0)
    if (validIncomes.length === 0) {
      toast.error("Adicione pelo menos uma entrada")
      return
    }

    try {
      for (const income of validIncomes) {
        await createServiceIncome({
          serviceId: selectedService,
          type: income.type,
          amount: income.amount,
          paymentMethod: income.paymentMethod,
          observations: income.observations,
        })
      }

      await updateService(selectedService, {
        status: "finalizado",
      })

      toast.success("Arrecadação registrada com sucesso!")
      
      // Disparar evento para atualizar o dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboard:refresh'))
        window.dispatchEvent(new CustomEvent('cash:refresh'))
      }
      
      setCurrentStep(1)
      setSelectedService("")
      setIncomes([
        { id: "1", type: "dizimo", amount: 0, paymentMethod: "dinheiro" },
        { id: "2", type: "oferta", amount: 0, paymentMethod: "dinheiro" },
      ])
      await loadServices()
      await loadAllServices()
    } catch (error) {
      console.error("Error finishing service:", error)
      toast.error("Erro ao registrar arrecadação")
    }
  }

  // Configurar handlers
  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.type || !newTemplate.dayOfWeek || !newTemplate.time) {
      toast.error("Preencha todos os campos")
      return
    }

    setIsSaving(true)
    try {
      const dayOfWeekValue = parseInt(newTemplate.dayOfWeek)
      await createServiceTemplate({
        name: newTemplate.name,
        type: newTemplate.type as any,
        time: newTemplate.time,
        dayOfWeek: dayOfWeekValue,
        isRecurring: true,
        isActive: true,
      })
      
      toast.success("Template criado com sucesso!")
      setNewTemplate({ name: "", type: "", dayOfWeek: "", time: "" })
      await loadTemplates()
    } catch (error) {
      console.error("Error creating template:", error)
      toast.error("Erro ao criar template")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleTemplate = async (id: string, isActive: boolean) => {
    try {
      await updateServiceTemplate(id, { isActive: !isActive })
      await loadTemplates()
    } catch (error) {
      console.error("Error updating template:", error)
      toast.error("Erro ao atualizar template")
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return
    
    try {
      await deleteServiceTemplate(id)
      toast.success("Template excluído com sucesso!")
      await loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Erro ao excluir template")
    }
  }

  // Encontrar próximo culto
  const now = new Date()
  const upcomingServices = services
    .filter((s) => s.status === "agendado" || s.status === "em_andamento")
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  
  const nextService = upcomingServices.find((s) => {
    const serviceDate = new Date(s.date)
    const serviceDateTime = new Date(`${s.date.toISOString().split('T')[0]}T${s.time}`)
    return serviceDateTime >= now || isToday(serviceDate)
  }) || upcomingServices[0]

  const finishedServices = services.filter((s) => s.status === "finalizado")
  const totalArrecadado = finishedServices.reduce((sum, s) => sum + (s.totalIncome || 0), 0)

  return (
    <AppLayout breadcrumbs={[{ label: "Cultos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cultos</h1>
            <p className="text-muted-foreground">Gerencie cultos, configure templates e registre arrecadações</p>
          </div>
          {activeTab === "lista" && (
            <Button 
              variant="outline" 
              onClick={handleGenerateWeekly}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Gerar Próximas Semanas
            </Button>
          )}
        </div>

        {/* Próximo Culto Card */}
        {nextService && activeTab === "lista" && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Próximo Culto</h3>
                      <Badge variant="default" className="bg-primary">
                        {isToday(nextService.date) ? "Hoje" : 
                         differenceInDays(nextService.date, now) === 1 ? "Amanhã" :
                         `${differenceInDays(nextService.date, now)} dias`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {nextService.name} - {formatDate(nextService.date)} às {nextService.time}
                    </p>
                  </div>
                </div>
                <Button onClick={() => {
                  setActiveTab("fechamento")
                  setSelectedService(nextService.id)
                  setCurrentStep(2)
                }}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Registrar Arrecadação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lista">Lista de Cultos</TabsTrigger>
            <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
            <TabsTrigger value="configurar">Configurar</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Church className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum culto encontrado</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Configure os cultos semanais e clique em "Gerar Próximas Semanas" para criar os cultos.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab("configurar")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Configurar Cultos
                    </Button>
                    <Button onClick={handleGenerateWeekly} disabled={isGenerating}>
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Gerar Próximas Semanas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {finishedServices.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Arrecadado</CardDescription>
                        <CardTitle className="text-2xl text-emerald-600">
                          {formatCurrency(totalArrecadado)}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Cultos Finalizados</CardDescription>
                        <CardTitle className="text-2xl">{finishedServices.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Média por Culto</CardDescription>
                        <CardTitle className="text-2xl">
                          {finishedServices.length > 0
                            ? formatCurrency(totalArrecadado / finishedServices.length)
                            : formatCurrency(0)}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                )}
                <DataTable 
                  columns={createColumns(nextService)} 
                  data={services} 
                  searchKey="name" 
                  searchPlaceholder="Buscar cultos..." 
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="fechamento" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Arrecadação</CardTitle>
                <CardDescription>Selecione um culto e registre as entradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Progress value={(currentStep / 3) * 100} className="w-full" />
                  <div className="flex justify-between text-sm">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-2 ${
                          currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            currentStep >= step.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                        </div>
                        {step.name}
                      </div>
                    ))}
                  </div>

                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          {pendingServices.length} {pendingServices.length === 1 ? 'culto encontrado' : 'cultos encontrados'}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentIndex = pendingServices.findIndex(s => s.id === selectedService)
                              if (currentIndex > 0) {
                                setSelectedService(pendingServices[currentIndex - 1].id)
                              }
                            }}
                            disabled={!selectedService || pendingServices.findIndex(s => s.id === selectedService) === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentIndex = pendingServices.findIndex(s => s.id === selectedService)
                              if (currentIndex < pendingServices.length - 1) {
                                setSelectedService(pendingServices[currentIndex + 1].id)
                              }
                            }}
                            disabled={!selectedService || pendingServices.findIndex(s => s.id === selectedService) === pendingServices.length - 1}
                          >
                            Próximo
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
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

                  {currentStep === 2 && service && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>{service.name}</CardTitle>
                          <CardDescription>
                            {formatDate(service.date)} às {service.time}
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Entradas</Label>
                          <Button variant="outline" size="sm" onClick={addIncome}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar
                          </Button>
                        </div>

                        {incomes.map((income, index) => (
                          <Card key={income.id}>
                            <CardContent className="pt-6">
                              <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                  <Label>Tipo</Label>
                                  <Select
                                    value={income.type}
                                    onValueChange={(value) => updateIncome(income.id, "type", value)}
                                  >
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
                                <div>
                                  <Label>Valor</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={income.amount || ""}
                                    onChange={(e) => updateIncome(income.id, "amount", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label>Forma de Pagamento</Label>
                                  <Select
                                    value={income.paymentMethod}
                                    onValueChange={(value) => updateIncome(income.id, "paymentMethod", value)}
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
                                <div className="flex items-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeIncome(income.id)}
                                    className="w-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && service && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Revisão</CardTitle>
                          <CardDescription>Confirme os dados antes de finalizar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Culto</Label>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(service.date)} às {service.time}
                            </p>
                          </div>
                          <Separator />
                          <div>
                            <Label className="text-sm text-muted-foreground mb-2 block">Entradas</Label>
                            {incomes
                              .filter((i) => i.amount > 0)
                              .map((income) => (
                                <div key={income.id} className="flex justify-between py-2">
                                  <span>
                                    {incomeTypes.find((t) => t.value === income.type)?.label} -{" "}
                                    {paymentMethods.find((m) => m.value === income.paymentMethod)?.label}
                                  </span>
                                  <span className="font-medium">{formatCurrency(income.amount)}</span>
                                </div>
                              ))}
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-emerald-600">{formatCurrency(totalAmount)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentStep > 1) {
                          setCurrentStep(currentStep - 1)
                        }
                      }}
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    {currentStep < 3 ? (
                      <Button
                        onClick={() => {
                          if (currentStep === 1 && !selectedService) {
                            toast.error("Selecione um culto")
                            return
                          }
                          if (currentStep === 2) {
                            const validIncomes = incomes.filter((i) => i.amount > 0)
                            if (validIncomes.length === 0) {
                              toast.error("Adicione pelo menos uma entrada")
                              return
                            }
                          }
                          setCurrentStep(currentStep + 1)
                        }}
                      >
                        Próximo
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleFinish}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configurar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Cultos Semanais</CardTitle>
                <CardDescription>Crie templates para gerar cultos automaticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label>Nome do Culto</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Ex: Culto Dominical"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={newTemplate.type}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dia da Semana</Label>
                    <Select
                      value={newTemplate.dayOfWeek}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, dayOfWeek: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {dayNames.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={newTemplate.time}
                      onChange={(e) => setNewTemplate({ ...newTemplate, time: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddTemplate} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar Template
                </Button>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Templates Configurados</Label>
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum template configurado</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => {
                        const dayName = dayNames.find((d) => d.value === String(template.dayOfWeek))
                        const typeName = serviceTypes.find((t) => t.value === template.type)?.label
                        
                        return (
                          <Card key={template.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-medium">{template.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {dayName?.label || `Dia ${template.dayOfWeek}`} às {template.time} - {typeName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`active-${template.id}`} className="text-sm">
                                      Ativo
                                    </Label>
                                    <Switch
                                      id={`active-${template.id}`}
                                      checked={template.isActive}
                                      onCheckedChange={() => handleToggleTemplate(template.id, template.isActive)}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
