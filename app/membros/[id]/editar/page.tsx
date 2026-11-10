"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberForm } from "@/components/members/member-form"
import { getMember, updateMember, type MemberInput } from "@/lib/services/members"
import type { Member } from "@/lib/types"

export default function EditarMembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMember(id)
      .then(setMember)
      .catch((error) => {
        console.error("Erro ao carregar membro:", error)
        setMember(null)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async (data: MemberInput) => {
    try {
      await updateMember(id, data)
      toast.success("Membro atualizado com sucesso!")
      router.push(`/membros/${id}`)
    } catch (error) {
      console.error("Erro ao atualizar membro:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar membro")
    }
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Membros", href: "/membros" },
        ...(member ? [{ label: member.name, href: `/membros/${id}` }] : []),
        { label: "Editar" },
      ]}
    >
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Editar Membro</h1>
          <p className="text-muted-foreground">Atualize os dados cadastrais</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !member ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">Membro não encontrado.</p>
              <Button onClick={() => router.push("/membros")}>Voltar para Membros</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
              <CardDescription>{member.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberForm initial={member} submitLabel="Salvar alterações" onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
