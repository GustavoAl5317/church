"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { memberRoleLabels, memberStatusLabels, ministries } from "@/lib/constants"
import type { MemberInput } from "@/lib/services/members"
import type { Member, MemberRole, MemberStatus } from "@/lib/types"

interface MemberFormProps {
  initial?: Member
  submitLabel: string
  onSubmit: (data: MemberInput) => Promise<void>
}

function DateField({
  label,
  value,
  onChange,
  birth,
}: {
  label: string
  value?: Date
  onChange: (date?: Date) => void
  birth?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: ptBR }) : "Selecione"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={ptBR}
            defaultMonth={value}
            {...(birth ? { captionLayout: "dropdown" as const, fromYear: 1920, toYear: new Date().getFullYear() } : {})}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function MemberForm({ initial, submitLabel, onSubmit }: MemberFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(initial?.name ?? "")
  const [email, setEmail] = useState(initial?.email ?? "")
  const [phone, setPhone] = useState(initial?.phone ?? "")
  const [address, setAddress] = useState(initial?.address ?? "")
  const [birthDate, setBirthDate] = useState<Date | undefined>(initial?.birthDate)
  const [entryDate, setEntryDate] = useState<Date>(initial?.entryDate ?? new Date())
  const [status, setStatus] = useState<MemberStatus>(initial?.status ?? "ativo")
  const [memberRole, setMemberRole] = useState<MemberRole>(initial?.memberRole ?? "membro")
  const [baptized, setBaptized] = useState(initial?.baptized ?? false)
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>(initial?.ministries ?? [])
  const [observations, setObservations] = useState(initial?.observations ?? "")

  const toggleMinistry = (ministry: string) => {
    setSelectedMinistries((prev) =>
      prev.includes(ministry) ? prev.filter((m) => m !== ministry) : [...prev, ministry],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSubmit({
        name,
        email,
        phone,
        address,
        birthDate,
        entryDate,
        status,
        memberRole,
        baptized,
        ministries: selectedMinistries,
        observations,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo *</Label>
        <Input id="name" placeholder="Nome do membro" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DateField label="Data de nascimento" value={birthDate} onChange={setBirthDate} birth />
        <DateField label="Membro desde" value={entryDate} onChange={(d) => d && setEntryDate(d)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Rua, número, bairro, cidade"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Status de acompanhamento</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(memberStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Função na igreja</Label>
          <Select value={memberRole} onValueChange={(v) => setMemberRole(v as MemberRole)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(memberRoleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="baptized">Batizado</Label>
          <p className="text-sm text-muted-foreground">Marque se a pessoa já foi batizada</p>
        </div>
        <Switch id="baptized" checked={baptized} onCheckedChange={setBaptized} />
      </div>

      <div className="space-y-3">
        <Label>Ministérios</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {ministries.map((ministry) => (
            <div key={ministry} className="flex items-center space-x-2">
              <Checkbox
                id={`ministry-${ministry}`}
                checked={selectedMinistries.includes(ministry)}
                onCheckedChange={() => toggleMinistry(ministry)}
              />
              <label htmlFor={`ministry-${ministry}`} className="text-sm font-medium leading-none">
                {ministry}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          placeholder="Observações sobre o membro..."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
