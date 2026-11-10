"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { paymentMethods, titheStatusLabels, titheTypeLabels } from "@/lib/constants"
import type { TitheInput } from "@/lib/services/tithes"
import type { Member, PaymentMethod, Tithe, TitheStatus, TitheType } from "@/lib/types"

interface TitheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  initial?: Tithe | null
  onSubmit: (data: TitheInput) => Promise<void>
}

function todayInput() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function dateToInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function TitheDialog({ open, onOpenChange, members, initial, onSubmit }: TitheDialogProps) {
  const [memberId, setMemberId] = useState<string | undefined>()
  const [memberName, setMemberName] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [type, setType] = useState<TitheType>("dizimo")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(todayInput())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")
  const [status, setStatus] = useState<TitheStatus>("confirmado")
  const [observations, setObservations] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Preenche o formulário sempre que o diálogo abre
  useEffect(() => {
    if (!open) return
    setMemberId(initial?.memberId)
    setMemberName(initial?.memberName ?? "")
    setType(initial?.type ?? "dizimo")
    setAmount(initial ? initial.amount.toFixed(2) : "")
    setDate(initial ? dateToInput(initial.date) : todayInput())
    setPaymentMethod(initial?.paymentMethod ?? "pix")
    setStatus(initial?.status ?? "confirmado")
    setObservations(initial?.observations ?? "")
    setError("")
  }, [open, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const value = Number(amount.replace(",", "."))
    if (!memberName.trim()) {
      setError("Escolha o membro ou digite o nome de quem contribuiu.")
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Informe um valor maior que zero.")
      return
    }
    const [y, m, d] = date.split("-").map(Number)
    if (!y || !m || !d) {
      setError("Informe a data.")
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({
        memberId,
        memberName,
        type,
        amount: Math.round(value * 100) / 100,
        date: new Date(y, m - 1, d, 12),
        paymentMethod,
        status,
        observations,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Editar registro" : "Novo registro"}</DialogTitle>
            <DialogDescription>Dízimo ou oferta recebida</DialogDescription>
          </DialogHeader>

          {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label>Membro</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal", !memberName && "text-muted-foreground")}
                >
                  {memberName || "Selecione ou digite um nome"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar membro..."
                    onValueChange={(text) => {
                      // Permite registrar quem não é membro (ex.: visitante) digitando o nome
                      setMemberId(undefined)
                      setMemberName(text)
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum membro encontrado. O nome digitado será usado.</CommandEmpty>
                    <CommandGroup>
                      {members.map((member) => (
                        <CommandItem
                          key={member.id}
                          value={`${member.name} ${member.email ?? ""}`}
                          onSelect={() => {
                            setMemberId(member.id)
                            setMemberName(member.name)
                            setPickerOpen(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", memberId === member.id ? "opacity-100" : "opacity-0")} />
                          {member.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as TitheType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(titheTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TitheStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(titheStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
