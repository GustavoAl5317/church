"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Church, Receipt, Calendar, Users } from "lucide-react"

const actions = [
  {
    title: "Lançar Entrada do Culto",
    description: "Registrar dízimos e ofertas",
    icon: Church,
    href: "/cultos/fechamento",
    variant: "default" as const,
  },
  {
    title: "Criar Despesa",
    description: "Nova despesa",
    icon: Receipt,
    href: "/contas-a-pagar/nova",
    variant: "outline" as const,
  },
  {
    title: "Criar Evento",
    description: "Novo evento ou campanha",
    icon: Calendar,
    href: "/eventos/novo",
    variant: "outline" as const,
  },
  {
    title: "Cadastrar Membro",
    description: "Adicionar novo membro",
    icon: Users,
    href: "/membros/novo",
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>Acesse as funções mais utilizadas</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Button key={action.title} variant={action.variant} className="h-auto flex-col items-start gap-1 p-4" asChild>
            <Link href={action.href}>
              <div className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                <span className="font-medium">{action.title}</span>
              </div>
              <span className="text-xs font-normal text-muted-foreground">{action.description}</span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
