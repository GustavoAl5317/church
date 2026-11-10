import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { Event } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type EventRow = Database['public']['Tables']['events']['Row']
export type EventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome' | 'totalExpense'>

function toDateOnly(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    // Bancos que ainda não rodaram a migração não têm as colunas novas
    type: (row.event_type as Event['type']) || 'outro',
    startDate: parseDate(row.start_date)!,
    startTime: row.start_time || undefined,
    endDate: row.end_date ? parseDate(row.end_date) : undefined,
    location: row.location || undefined,
    capacity: row.capacity ?? undefined,
    attendance: row.attendance ?? 0,
    status: row.status as Event['status'],
    cashBoxId: row.cash_box_id || undefined,
    totalIncome: Number(row.total_income) || 0,
    totalExpense: Number(row.total_expense) || 0,
    observations: row.observations || undefined,
    createdAt: parseDate(row.created_at)!,
    updatedAt: parseDate(row.updated_at)!,
  }
}

function toRow(event: Partial<EventInput & Pick<Event, 'totalIncome' | 'totalExpense'>>) {
  const row: Record<string, unknown> = {}
  if (event.name !== undefined) row.name = event.name.trim()
  if (event.description !== undefined) row.description = event.description?.trim() || null
  if (event.type !== undefined) row.event_type = event.type
  if (event.startDate !== undefined) row.start_date = toDateOnly(event.startDate)
  if (event.startTime !== undefined) row.start_time = event.startTime || null
  if (event.endDate !== undefined) row.end_date = event.endDate ? toDateOnly(event.endDate) : null
  if (event.location !== undefined) row.location = event.location?.trim() || null
  if (event.capacity !== undefined) row.capacity = event.capacity ?? null
  if (event.attendance !== undefined) row.attendance = event.attendance
  if (event.status !== undefined) row.status = event.status
  if (event.cashBoxId !== undefined) row.cash_box_id = event.cashBoxId || null
  if (event.totalIncome !== undefined) row.total_income = event.totalIncome
  if (event.totalExpense !== undefined) row.total_expense = event.totalExpense
  if (event.observations !== undefined) row.observations = event.observations?.trim() || null
  return row
}

export async function getEvents() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado, retornando array vazio para eventos')
    return []
  }

  try {
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: false })

    if (error) throw error
    return (data || []).map(mapEvent)
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return []
  }
}

export async function getEvent(id: string) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()

  if (error) throw error
  return mapEvent(data)
}

export async function createEvent(event: EventInput) {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...toRow(event), total_income: 0, total_expense: 0 } as Database['public']['Tables']['events']['Insert'])
    .select()
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...toRow(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) throw error
}
