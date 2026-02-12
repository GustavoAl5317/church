import { format as dateFnsFormat } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: Date | string, formatStr = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return dateFnsFormat(d, formatStr, { locale: ptBR })
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}
