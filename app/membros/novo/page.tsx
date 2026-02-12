"use client"

import type React from "react"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ministries } from "@/lib/constants"
import { toast } from "sonner"

// ✅ Supabase inline (sem depender de "@/lib/supabase/client")
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "")

export default function NovoMembroPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [birthDate, setBirthDate] = useState<Date>()
  const [entryDate, setEntryDate] = useState<Date>(new Date())
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "ativo",
    observations: "",
  })

  const toggleMinistry = (ministry: string) => {
    setSelectedMinistries((prev) => (prev.includes(ministry) ? prev.filter((m) => m !== ministry) : [...prev, ministry]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      toast.error("Supabase não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env")
      return
    }

    if (!formData.name.trim()) {
      toast.error("Informe o nome do membro")
      return
    }

    setIsLoading(true)
    try {
      // ⚠️ Ajuste aqui o nome da tabela se não for "members"
      // Ex: "membros" ou "members"
      const TABLE_NAME = "members"

      // ⚠️ Ajuste aqui os nomes das colunas conforme seu schema
      const payload = {
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        status: formData.status,
        observations: formData.observations?.trim() || null,
        birth_date: birthDate ? birthDate.toISOString() : null,
        entry_date: entryDate ? entryDate.toISOString() : new Date().toISOString(),
        ministries: selectedMinistries, // precisa ser coluna text[] ou jsonb
      }

      const { error } = await supabase.from(TABLE_NAME).insert(payload)

      if (error) {
        console.error("Supabase insert error:", error)
        toast.error(error.message || "Erro ao cadastrar membro")
        return
      }

      toast.success("Membro cadastrado com sucesso!")
      router.push("/membros")
      // refresh é opcional e pode não existir dependendo do router
      ;(router as any).refresh?.()
    } catch (err: any) {
      console.error("Error creating member:", err)
      toast.error(err?.message || "Erro ao cadastrar membro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Membros", href: "/membros" }, { label: "Novo Membro" }]}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Novo Membro</h1>
          <p className="text-muted-foreground">Cadastre um novo membro ou visitante</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Preencha os dados do novo membro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Nome do membro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        locale={ptBR}
                        captionLayout="dropdown"
                        fromYear={1930}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Entrada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {entryDate ? format(entryDate, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={entryDate} onSelect={(d) => d && setEntryDate(d)} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="visitante">Visitante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Ministérios</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ministries.map((ministry) => (
                    <div key={ministry} className="flex items-center space-x-2">
                      <Checkbox
                        id={ministry}
                        checked={selectedMinistries.includes(ministry)}
                        onCheckedChange={() => toggleMinistry(ministry)}
                      />
                      <label
                        htmlFor={ministry}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
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
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
                />
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
                    "Cadastrar Membro"
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
