"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, DollarSign, HelpCircle, X, CheckCircle, Loader2 } from "lucide-react"
import { getCashTransactions } from "@/lib/services/cash"
import { getCashBoxes } from "@/lib/services/cash"
import type { CashTransaction } from "@/lib/types"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/format"
import { toast } from "sonner"
import { updateCashTransaction } from "@/lib/services/cash"

interface UnidentifiedIncome {
  transaction: CashTransaction
  needsClassification: boolean
}

export function IncomeAlerts() {
  const [unidentifiedIncomes, setUnidentifiedIncomes] = useState<UnidentifiedIncome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null)
  const [classification, setClassification] = useState({
    category: "",
    description: "",
    observations: "",
  })

  useEffect(() => {
    loadUnidentifiedIncomes()
  }, [])

  const loadUnidentifiedIncomes = async () => {
    try {
      setIsLoading(true)
      const cashBoxes = await getCashBoxes()
      const generalCashBox = cashBoxes.find((c) => c.type === 'geral')
      
      if (!generalCashBox) {
        setIsLoading(false)
        return
      }

      // Buscar entradas dos últimos 7 dias
      const today = new Date()
      const sevenDaysAgo = subDays(today, 7)
      
      const transactions = await getCashTransactions(
        generalCashBox.id,
        startOfDay(sevenDaysAgo),
        endOfDay(today)
      )

      // Identificar entradas que precisam de classificação
      // Entradas com categoria genérica ou descrição vaga
      const unidentified = transactions
        .filter(t => t.type === 'entrada')
        .filter(t => {
          // Verifica se a categoria é muito genérica ou descrição vaga
          const genericCategories = ['Culto', 'Outros', 'Outras', 'Outra']
          const vagueDescriptions = ['entrada', 'recebimento', 'depósito', 'recebido', 'valor recebido']
          
          const categoryLower = (t.category || '').toLowerCase()
          const descLower = (t.description || '').toLowerCase()
          
          return (
            genericCategories.some(cat => categoryLower.includes(cat.toLowerCase())) ||
            vagueDescriptions.some(vague => descLower.includes(vague)) ||
            !t.description ||
            t.description.trim().length < 10 ||
            descLower === 'entrada' ||
            descLower === 'recebimento'
          )
        })
        .map(t => ({
          transaction: t,
          needsClassification: true,
        }))
        .slice(0, 5) // Mostrar apenas as 5 mais recentes

      setUnidentifiedIncomes(unidentified)
    } catch (error) {
      console.error("Error loading unidentified incomes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClassify = async () => {
    if (!selectedTransaction || !classification.category || !classification.description) {
      toast.error("Preencha categoria e descrição")
      return
    }

    try {
      await updateCashTransaction(selectedTransaction.id, {
        category: classification.category,
        description: classification.description,
        observations: classification.observations || selectedTransaction.observations,
      })

      toast.success("Entrada classificada com sucesso!")
      setDialogOpen(false)
      setSelectedTransaction(null)
      setClassification({ category: "", description: "", observations: "" })
      await loadUnidentifiedIncomes()
    } catch (error) {
      console.error("Error classifying income:", error)
      toast.error("Erro ao classificar entrada")
    }
  }

  const handleDismiss = async (transaction: CashTransaction) => {
    // Marcar como já revisado (pode adicionar um campo no banco depois)
    setUnidentifiedIncomes(prev => prev.filter(u => u.transaction.id !== transaction.id))
    toast.success("Aviso ignorado")
  }

  if (isLoading) {
    return null
  }

  if (unidentifiedIncomes.length === 0) {
    return null
  }

  const categories = [
    "Dízimo",
    "Oferta",
    "Doação",
    "Campanha",
    "Evento",
    "Venda",
    "Aluguel",
    "Outros",
  ]

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <HelpCircle className="h-5 w-5" />
            Classificar Entradas
          </CardTitle>
          <CardDescription>
            Encontramos {unidentifiedIncomes.length} entrada(s) que precisam de classificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unidentifiedIncomes.map(({ transaction }) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                    <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transaction.description || "Sem descrição"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(transaction.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTransaction(transaction)
                      setClassification({
                        category: transaction.category,
                        description: transaction.description,
                        observations: transaction.observations || "",
                      })
                      setDialogOpen(true)
                    }}
                  >
                    Classificar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(transaction)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Classificação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classificar Entrada</DialogTitle>
            <DialogDescription>
              Ajude-nos a classificar esta entrada para melhor organização
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTransaction && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold">{formatCurrency(selectedTransaction.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Data: {format(selectedTransaction.date, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={classification.category}
                onValueChange={(value) => setClassification({ ...classification, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={classification.description}
                onChange={(e) => setClassification({ ...classification, description: e.target.value })}
                placeholder="Ex: Dízimo do culto de domingo, Oferta especial..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={classification.observations}
                onChange={(e) => setClassification({ ...classification, observations: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleClassify} disabled={!classification.category || !classification.description}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Classificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
