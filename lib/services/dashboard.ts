import { getCashBoxes, getCashTransactions } from './cash'
import { getBillsPayable } from './bills'
import { getServices } from './services'
import type { DashboardSummary, ChartData, IncomeByTypeData } from '@/lib/types'
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Retornar valores padrão se Supabase não estiver configurado
  if (!isSupabaseConfigured) {
    return {
      generalBalance: 0,
      monthBalance: 0,
      monthIncome: 0,
      monthExpense: 0,
      upcomingBills: 0,
      overdueBills: 0,
    }
  }

  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Get general cash box
    const cashBoxes = await getCashBoxes()
    const generalCashBox = cashBoxes.find((c) => c.type === 'geral')
    const generalBalance = generalCashBox?.balance || 0

    console.log(`📦 Caixa geral encontrado:`, generalCashBox ? { id: generalCashBox.id, balance: generalCashBox.balance } : 'NÃO ENCONTRADO')

    // Get month transactions
    const monthTransactions = await getCashTransactions(
      generalCashBox?.id,
      startOfDay(monthStart),
      endOfDay(monthEnd)
    )

    console.log(`📊 Transações do mês encontradas: ${monthTransactions.length}`)
    console.log(`📊 Período: ${monthStart.toLocaleDateString('pt-BR')} até ${monthEnd.toLocaleDateString('pt-BR')}`)
    
    const entradas = monthTransactions.filter((t) => t.type === 'entrada')
    const saidas = monthTransactions.filter((t) => t.type === 'saida')
    
    console.log(`📊 Entradas: ${entradas.length}, Saídas: ${saidas.length}`)
    console.log(`📊 Detalhes das entradas:`, entradas.map(t => ({ 
      desc: t.description, 
      valor: t.amount, 
      data: t.date.toLocaleDateString('pt-BR'),
      categoria: t.category 
    })))

    const monthIncome = entradas.reduce((sum, t) => sum + t.amount, 0)
    const monthExpense = saidas.reduce((sum, t) => sum + t.amount, 0)
    
    console.log(`📊 Total de entradas: ${monthIncome}, Total de saídas: ${monthExpense}`)

    const monthBalance = monthIncome - monthExpense

    // Get bills - apenas do mês atual
    const bills = await getBillsPayable()
    const nowDate = new Date()
    
    // Filtrar apenas despesas com vencimento no mês atual
    const monthBills = bills.filter((b) => {
      const billDate = new Date(b.dueDate)
      return (
        billDate.getMonth() === nowDate.getMonth() &&
        billDate.getFullYear() === nowDate.getFullYear()
      )
    })

    // Despesas a vencer no mês (pendentes e ainda não vencidas)
    const upcomingBills = monthBills.filter(
      (b) =>
        (b.status === 'pendente' || b.status === 'atrasado') &&
        b.dueDate >= startOfDay(nowDate)
    ).length

    // Despesas atrasadas do mês
    const overdueBills = monthBills.filter(
      (b) => (b.status === 'atrasado' || (b.status === 'pendente' && b.dueDate < startOfDay(nowDate)))
    ).length

    return {
      generalBalance,
      monthBalance,
      monthIncome,
      monthExpense,
      upcomingBills,
      overdueBills,
    }
  } catch (error) {
    console.error('Erro ao buscar resumo do dashboard:', error)
    // Retornar valores padrão em caso de erro
    return {
      generalBalance: 0,
      monthBalance: 0,
      monthIncome: 0,
      monthExpense: 0,
      upcomingBills: 0,
      overdueBills: 0,
    }
  }
}

export async function getMonthlyChartData(months: number = 6): Promise<ChartData[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  try {
    const now = new Date()
    const cashBoxes = await getCashBoxes()
    const generalCashBox = cashBoxes.find((c) => c.type === 'geral')

    if (!generalCashBox) {
      return []
    }

    const data: ChartData[] = []

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const transactions = await getCashTransactions(
        generalCashBox.id,
        startOfDay(monthStart),
        endOfDay(monthEnd)
      )

      const entradas = transactions
        .filter((t) => t.type === 'entrada')
        .reduce((sum, t) => sum + t.amount, 0)

      const gastos = transactions
        .filter((t) => t.type === 'saida')
        .reduce((sum, t) => sum + t.amount, 0)

      data.push({
        month: format(monthDate, 'MMM', { locale: { localize: { month: (n: number) => ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][n] } } as any }).slice(0, 3),
        entradas,
        gastos,
      })
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico mensal:', error)
    return []
  }
}

export async function getIncomeByTypeData(): Promise<IncomeByTypeData[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const services = await getServices(startOfDay(monthStart), endOfDay(monthEnd))
    const serviceIds = services.map((s) => s.id)

    // Get service incomes for this month
    const { supabase } = await import('@/lib/supabase')
    const incomes: Array<{ type: string; amount: number }> = []
    
    if (serviceIds.length > 0) {
      const { data: serviceIncomes, error } = await supabase
        .from('service_incomes')
        .select('type, amount')
        .in('service_id', serviceIds)

      if (error) {
        console.error('Error fetching service incomes:', error)
      } else if (serviceIncomes) {
        incomes.push(...serviceIncomes.map((inc: any) => ({ type: inc.type, amount: Number(inc.amount) })))
      }
    }

    // Also get cash transactions that are income
    const cashBoxes = await getCashBoxes()
    const generalCashBox = cashBoxes.find((c) => c.type === 'geral')
    
    if (generalCashBox) {
      const transactions = await getCashTransactions(
        generalCashBox.id,
        startOfDay(monthStart),
        endOfDay(monthEnd)
      )
      
      const transactionIncomes = transactions
        .filter((t) => t.type === 'entrada' && t.category === 'Culto')
        .map((t) => ({ type: 'oferta', amount: t.amount }))
      
      incomes.push(...transactionIncomes)
    }

    // Group by type
    const typeMap = new Map<string, number>()
    
    incomes.forEach((income) => {
      const current = typeMap.get(income.type) || 0
      typeMap.set(income.type, current + Number(income.amount))
    })

    const typeLabels: Record<string, string> = {
      dizimo: 'Dízimo',
      oferta: 'Oferta',
      doacao: 'Doação',
      campanha: 'Campanha',
      outros: 'Outros',
    }

    const colors = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
    ]

    return Array.from(typeMap.entries())
      .map(([type, value], index) => ({
        type: typeLabels[type] || type,
        value,
        fill: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
  } catch (error) {
    console.error('Erro ao buscar dados de receita por tipo:', error)
    return []
  }
}

export interface CommunitySummary {
  members: number | null
  eventsThisMonth: number
  tithesThisMonth: number | null
  servicesThisMonth: number
}

function monthRange() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const first = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { first, last: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}` }
}

/**
 * Números do topo do dashboard. Membros e dízimos só são buscados para quem tem acesso a eles.
 */
export async function getCommunitySummary(options: {
  includeMembers: boolean
  includeTithes: boolean
}): Promise<CommunitySummary> {
  if (!isSupabaseConfigured) {
    return { members: null, eventsThisMonth: 0, tithesThisMonth: null, servicesThisMonth: 0 }
  }

  const { first, last } = monthRange()

  const [members, events, services, tithes] = await Promise.all([
    options.includeMembers
      ? supabase.from('members').select('id', { count: 'exact', head: true }).neq('status', 'inativo')
      : null,
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('start_date', first)
      .lte('start_date', last)
      .neq('status', 'cancelado'),
    supabase.from('services').select('id', { count: 'exact', head: true }).gte('date', first).lte('date', last),
    options.includeTithes
      ? supabase
          .from('tithes')
          .select('amount')
          .eq('status', 'confirmado')
          .gte('date', first)
          .lte('date', last)
      : null,
  ])

  return {
    members: members ? members.count ?? 0 : null,
    eventsThisMonth: events.count ?? 0,
    servicesThisMonth: services.count ?? 0,
    tithesThisMonth: tithes
      ? (tithes.data || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
      : null,
  }
}
