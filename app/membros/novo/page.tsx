"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberForm } from "@/components/members/member-form"
import { createMember, type MemberInput } from "@/lib/services/members"

export default function NovoMembroPage() {
  const router = useRouter()

  const handleSubmit = async (data: MemberInput) => {
    try {
      await createMember(data)
      toast.success("Membro cadastrado com sucesso!")
      router.push("/membros")
    } catch (error) {
      console.error("Erro ao cadastrar membro:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar membro")
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
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>Preencha os dados do novo membro</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberForm submitLabel="Cadastrar Membro" onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
