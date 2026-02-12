"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Users, History, Loader2 } from "lucide-react"
import { getMember } from "@/lib/services/members"
import type { Member } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"
import { toast } from "sonner"

const statusConfig = {
  ativo: { label: "Ativo", variant: "default" as const },
  inativo: { label: "Inativo", variant: "secondary" as const },
  visitante: { label: "Visitante", variant: "outline" as const },
}

export default function MembroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMember()
  }, [id])

  const loadMember = async () => {
    try {
      setIsLoading(true)
      const data = await getMember(id)
      setMember(data)
    } catch (error) {
      console.error("Error loading member:", error)
      toast.error("Erro ao carregar membro")
      setMember(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Membros", href: "/membros" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!member) {
    return (
      <AppLayout breadcrumbs={[{ label: "Membros", href: "/membros" }, { label: "Não encontrado" }]}>
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Membro não encontrado</h1>
          <p className="text-muted-foreground mb-4">O membro solicitado não existe ou foi removido.</p>
          <Button onClick={() => router.push("/membros")}>Voltar para Membros</Button>
        </div>
      </AppLayout>
    )
  }

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")

  const statusInfo = statusConfig[member.status]

  return (
    <AppLayout breadcrumbs={[{ label: "Membros", href: "/membros" }, { label: member.name }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {member.ministries.length > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{member.ministries.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href={`/membros/${id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.email && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{member.email}</p>
                      </div>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{member.phone}</p>
                      </div>
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="font-medium">{member.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.birthDate && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                        <p className="font-medium">{formatDate(member.birthDate, "dd 'de' MMMM 'de' yyyy")}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Entrada</p>
                      <p className="font-medium">{formatDate(member.entryDate, "dd 'de' MMMM 'de' yyyy")}</p>
                    </div>
                  </div>
                  {member.ministries.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ministérios</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.ministries.map((ministry) => (
                            <Badge key={ministry} variant="secondary">
                              {ministry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Observations */}
              {member.observations && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{member.observations}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico</CardTitle>
                <CardDescription>Registros e atividades do membro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cadastro criado</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(member.createdAt, "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Última atualização</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(member.updatedAt, "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
