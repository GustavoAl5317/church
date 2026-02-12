"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Calendar, Clock, RefreshCw } from "lucide-react"
import { getServiceTemplates, createServiceTemplate, updateServiceTemplate, deleteServiceTemplate, generateWeeklyServices } from "@/lib/services/services"
import type { ServiceTemplate } from "@/lib/types"
import { toast } from "sonner"
import { serviceTypes } from "@/lib/constants"

const dayNames = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
]

export default function ConfigurarCultosPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "",
    dayOfWeek: "",
    time: "",
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const data = await getServiceTemplates()
      setTemplates(data)
    } catch (error) {
      console.error("Error loading templates:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.type || !newTemplate.dayOfWeek || !newTemplate.time) {
      toast.error("Preencha todos os campos")
      return
    }

    setIsSaving(true)
    try {
      const dayOfWeekValue = parseInt(newTemplate.dayOfWeek)
      console.log(`📝 Criando template: ${newTemplate.name}, dia da semana selecionado: ${dayNames.find(d => d.value === newTemplate.dayOfWeek)?.label} (valor: ${dayOfWeekValue})`)
      
      const template = await createServiceTemplate({
        name: newTemplate.name,
        type: newTemplate.type as any,
        time: newTemplate.time,
        dayOfWeek: dayOfWeekValue,
        isRecurring: true,
        isActive: true,
      })
      console.log("✅ Template criado:", template)
      console.log(`✅ Template salvo com dayOfWeek: ${template.dayOfWeek} (${dayNames.find(d => d.value === template.dayOfWeek?.toString())?.label})`)
      toast.success("Culto configurado com sucesso!")
      setNewTemplate({ name: "", type: "", dayOfWeek: "", time: "" })
      await loadTemplates()
      
      // Perguntar se quer gerar os cultos agora
      if (confirm("Deseja gerar os cultos para as próximas semanas agora?")) {
        await handleGenerateServices()
      }
    } catch (error) {
      console.error("Error creating template:", error)
      toast.error(`Erro ao configurar culto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (template: ServiceTemplate) => {
    try {
      await updateServiceTemplate(template.id, { isActive: !template.isActive })
      toast.success(template.isActive ? "Culto desativado" : "Culto ativado")
      await loadTemplates()
    } catch (error) {
      console.error("Error updating template:", error)
      toast.error("Erro ao atualizar culto")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este culto?")) return

    try {
      await deleteServiceTemplate(id)
      toast.success("Culto removido")
      await loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Erro ao remover culto")
    }
  }

  const handleGenerateServices = async () => {
    if (templates.filter(t => t.isActive).length === 0) {
      toast.error("Nenhum culto ativo configurado. Ative pelo menos um culto primeiro.")
      return
    }

    setIsGenerating(true)
    try {
      const newServices = await generateWeeklyServices(4)
      toast.success(`${newServices.length} cultos gerados com sucesso!`)
      router.push("/cultos")
    } catch (error) {
      console.error("Error generating services:", error)
      toast.error(`Erro ao gerar cultos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Configurar" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Cultos", href: "/cultos" }, { label: "Configurar Cultos" }]}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurar Cultos da Igreja</h1>
          <p className="text-muted-foreground mt-2">
            Configure quais dias da semana sua igreja tem cultos. O sistema criará automaticamente os cultos e perguntará a arrecadação.
          </p>
        </div>

        {/* Adicionar Novo Culto */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Culto Semanal</CardTitle>
            <CardDescription>
              Configure um culto que acontece toda semana no mesmo dia e horário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Nome do Culto</Label>
                <Input
                  placeholder="Ex: Culto da Família"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <Select value={newTemplate.dayOfWeek} onValueChange={(v) => setNewTemplate({ ...newTemplate, dayOfWeek: v })}>
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
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={newTemplate.time}
                  onChange={(e) => setNewTemplate({ ...newTemplate, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newTemplate.type} onValueChange={(v) => setNewTemplate({ ...newTemplate, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
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
            </div>
            <Button onClick={handleAddTemplate} disabled={isSaving} className="mt-4">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Culto
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Cultos Configurados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cultos Configurados</CardTitle>
                <CardDescription>
                  Estes são os cultos que acontecem semanalmente na sua igreja
                </CardDescription>
              </div>
              {templates.filter(t => t.isActive).length > 0 && (
                <Button 
                  onClick={handleGenerateServices}
                  disabled={isGenerating}
                  variant="outline"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Gerar Cultos Agora
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum culto configurado ainda.</p>
                <p className="text-sm mt-2">Adicione um culto acima para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => {
                  // Garantir que dayOfWeek seja um número
                  let dayOfWeekValue: number | null = null
                  if (template.dayOfWeek !== null && template.dayOfWeek !== undefined) {
                    if (typeof template.dayOfWeek === 'number') {
                      dayOfWeekValue = template.dayOfWeek
                    } else {
                      const parsed = parseInt(String(template.dayOfWeek))
                      if (!isNaN(parsed)) {
                        dayOfWeekValue = parsed
                      }
                    }
                  }
                  
                  const dayName = dayOfWeekValue !== null 
                    ? dayNames.find((d) => d.value === String(dayOfWeekValue))
                    : null
                  const typeName = serviceTypes.find((t) => t.value === template.type)?.label
                  
                  // Debug apenas em desenvolvimento
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`Template ${template.name}: dayOfWeek = ${dayOfWeekValue} (${dayName?.label || 'não encontrado'})`)
                  }

                  return (
                    <div
                      key={template.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        !template.isActive ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {dayName?.label || `Dia ${dayOfWeekValue}`} às {template.time}
                                {process.env.NODE_ENV === 'development' && (
                                  <span className="text-xs text-muted-foreground ml-1">(valor: {dayOfWeekValue})</span>
                                )}
                              </span>
                              {typeName && <Badge variant="secondary">{typeName}</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${template.id}`} className="text-sm">
                            {template.isActive ? "Ativo" : "Inativo"}
                          </Label>
                          <Switch
                            id={`active-${template.id}`}
                            checked={template.isActive}
                            onCheckedChange={() => handleToggleActive(template)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <h3 className="font-medium mb-2">Como funciona?</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Configure os dias da semana que sua igreja tem cultos</li>
            <li>O sistema criará automaticamente os cultos para as próximas semanas</li>
            <li>Quando chegar o dia do culto, você poderá registrar a arrecadação</li>
            <li>Você pode ativar/desativar cultos sem removê-los</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
