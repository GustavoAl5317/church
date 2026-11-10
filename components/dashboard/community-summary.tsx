"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Church, HandCoins, Users, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { getCommunitySummary, type CommunitySummary as Summary } from "@/lib/services/dashboard"
import { formatCurrency } from "@/lib/utils/format"

export function CommunitySummary() {
  const { can } = useAuth()
  const includeMembers = can("membros")
  const includeTithes = can("dizimos")
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    getCommunitySummary({ includeMembers, includeTithes })
      .then(setSummary)
      .catch((error) => console.error("Erro ao carregar resumo:", error))
  }, [includeMembers, includeTithes])

  const cards: { label: string; value: string; icon: LucideIcon; color: string }[] = []
  if (includeMembers) {
    cards.push({ label: "Membros", value: summary?.members?.toString() ?? "…", icon: Users, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" })
  }
  cards.push({ label: "Eventos (mês)", value: summary?.eventsThisMonth.toString() ?? "…", icon: CalendarDays, color: "text-sky-600 bg-sky-100 dark:bg-sky-900/40" })
  if (includeTithes) {
    cards.push({
      label: "Dízimos (mês)",
      value: summary?.tithesThisMonth != null ? formatCurrency(summary.tithesThisMonth) : "…",
      icon: HandCoins,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40",
    })
  }
  cards.push({ label: "Cultos (mês)", value: summary?.servicesThisMonth.toString() ?? "…", icon: Church, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/40" })

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="py-4">
          <CardContent className="flex items-center justify-between px-4">
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
