"use client"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Share2,
  Target,
  HeartHandshake,
  ShieldCheck,
  Users,
  CalendarDays,
  HandCoins,
  Wallet,
  Code2,
  Network,
} from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const objectives = [
  "Centralizar as informações administrativas em um ambiente único",
  "Automatizar processos internos: cadastros, eventos e registros financeiros",
  "Melhorar a comunicação entre lideranças, secretaria e membros",
  "Oferecer uma plataforma segura, com autenticação e permissões por papel",
  "Manter os dados em um banco de dados real (Supabase), pronto para crescer",
]

const audiences = [
  { who: "Administradores", what: "Gestão completa de usuários, papéis e permissões" },
  { who: "Pastores", what: "Dashboard integrado, membros, eventos e controle financeiro" },
  { who: "Secretaria", what: "Cadastros, agenda e organização do dia a dia" },
  { who: "Tesouraria", what: "Caixa, fechamento de cultos e contas a pagar" },
  { who: "Membros", what: "Consulta da agenda e dos eventos da igreja" },
]

const features = [
  {
    icon: ShieldCheck,
    title: "Autenticação e segurança",
    items: [
      "Login com email e senha (senhas guardadas com hash PBKDF2)",
      "Recuperação de senha liberada pelo administrador",
      "Sessão persistente por 7 dias",
      "Logout seguro e controle de rotas por papel",
    ],
  },
  {
    icon: Users,
    title: "Gestão de membros",
    items: [
      "Cadastro completo com dados pessoais, batismo e ministérios",
      "Busca, filtros e edição rápida",
      "Status de acompanhamento: ativo, inativo ou visitante",
      "Importação em lote por planilha CSV",
    ],
  },
  {
    icon: CalendarDays,
    title: "Eventos e agenda",
    items: [
      "Calendário mensal interativo com cultos e eventos",
      "Registro de presença e taxa de ocupação",
      "Lista de próximos eventos no painel lateral",
    ],
  },
  {
    icon: HandCoins,
    title: "Dízimos e ofertas",
    items: [
      "Registro de entradas por membro",
      "Totais por tipo e por período",
      "Acesso exclusivo a pastores e administradores",
    ],
  },
  {
    icon: Wallet,
    title: "Financeiro",
    items: [
      "Fechamento de cultos com entradas por tipo",
      "Caixa geral e caixas por evento, com transferências",
      "Contas a pagar com fornecedores, categorias e calendário",
    ],
  },
]

const technologies = [
  ["Next.js 16", "Rotas modernas e boa performance"],
  ["React 19", "Componentes funcionais e interface fluida"],
  ["TypeScript", "Segurança de tipos e padronização"],
  ["Tailwind CSS v4", "Interface responsiva"],
  ["shadcn/ui", "Componentes modernos e acessíveis"],
  ["Context API + hooks", "Estado de autenticação compartilhado (useAuth)"],
  ["Supabase (PostgreSQL)", "Banco de dados na nuvem"],
]

const architecture = `app/
  dashboard/       Painel principal
  membros/         Membros
  eventos/         Eventos
  agenda/          Agenda
  dizimos/         Dízimos e ofertas
  cultos/          Cultos e fechamento
  caixa/           Caixa
  contas-a-pagar/  Despesas
  relatorio/       Relatório do projeto
  configuracoes/   Usuários e permissões (admin)
components/
  ui/              Componentes visuais
  auth/            Login e proteção de rotas
lib/
  permissions.ts   Regras de acesso
  services/        Acesso ao banco de dados
hooks/
  use-auth.ts      Autenticação`

export default function RelatorioPage() {
  const router = useRouter()

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: "Relatório do Projeto – Igreja Manager", url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success("Link copiado")
      }
    } catch (error) {
      // Cancelar o compartilhamento não é erro
      if (error instanceof Error && error.name === "AbortError") return
      toast.error("Não foi possível compartilhar")
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Relatório" }]}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="print-hidden flex items-center justify-between gap-2">
          <Button variant="destructive" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório do Projeto</h1>
          <p className="text-muted-foreground">Igreja Manager – Solução de Gestão</p>
        </div>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">O que é o Igreja Manager?</CardTitle>
            <CardDescription className="text-blue-900/80 dark:text-blue-100/80">
              Uma plataforma moderna e segura para a gestão da Igreja Livre Sou em Cristo (Rua das Rosas, 132 –
              Jandira). Ela reúne membros, eventos, agenda, dízimos e finanças em um só lugar, para apoiar a liderança
              nas decisões e fortalecer a organização interna.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Objetivo do projeto</CardTitle>
                <CardDescription>Modernizar a gestão administrativa da comunidade</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <HeartHandshake className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Como ajuda</CardTitle>
                <CardDescription>Benefícios para cada tipo de usuário</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {audiences.map((a) => (
                  <li key={a.who}>
                    <strong>{a.who}:</strong> {a.what}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Funcionalidades principais</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="gap-3 break-inside-avoid">
                <CardHeader className="flex flex-row items-center gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {feature.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center gap-3">
              <Code2 className="h-6 w-6 text-primary" />
              <CardTitle>Tecnologias utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {technologies.map(([name, description]) => (
                  <div key={name}>
                    <dt className="font-medium">{name}</dt>
                    <dd className="text-muted-foreground">{description}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center gap-3">
              <Network className="h-6 w-6 text-primary" />
              <CardTitle>Arquitetura resumida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">{architecture}</pre>
              <div className="text-sm">
                <p className="mb-1 font-medium">Fluxo geral</p>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                  <li>O usuário acessa o sistema e faz login.</li>
                  <li>O sistema verifica o papel e as permissões.</li>
                  <li>A interface mostra apenas o que é permitido.</li>
                  <li>O usuário executa as ações de acordo com seu nível de acesso.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
