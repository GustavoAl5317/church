import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { Event } from '@/lib/types'

export async function getEvents() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado, retornando array vazio para eventos')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      throw error
    }

    if (!data) {
      return []
    }

    return data.map((event): Event => ({
      id: event.id,
      name: event.name,
      description: event.description || undefined,
      startDate: parseDate(event.start_date)!,
      endDate: event.end_date ? parseDate(event.end_date) : undefined,
      status: event.status as Event['status'],
      cashBoxId: event.cash_box_id || undefined,
      totalIncome: Number(event.total_income) || 0,
      totalExpense: Number(event.total_expense) || 0,
      observations: event.observations || undefined,
      createdAt: parseDate(event.created_at)!,
      updatedAt: parseDate(event.updated_at)!,
    }))
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return [] // Retorna array vazio em caso de erro
  }
}

export async function getEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    startDate: parseDate(data.start_date)!,
    endDate: data.end_date ? parseDate(data.end_date) : undefined,
    status: data.status as Event['status'],
    cashBoxId: data.cash_box_id || undefined,
    totalIncome: Number(data.total_income) || 0,
    totalExpense: Number(data.total_expense) || 0,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome' | 'totalExpense'>) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: event.name,
      description: event.description || null,
      start_date: event.startDate.toISOString().split('T')[0],
      end_date: event.endDate ? event.endDate.toISOString().split('T')[0] : null,
      status: event.status || 'planejado',
      cash_box_id: event.cashBoxId || null,
      total_income: 0,
      total_expense: 0,
      observations: event.observations || null,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    startDate: parseDate(data.start_date)!,
    endDate: data.end_date ? parseDate(data.end_date) : undefined,
    status: data.status as Event['status'],
    cashBoxId: data.cash_box_id || undefined,
    totalIncome: Number(data.total_income) || 0,
    totalExpense: Number(data.total_expense) || 0,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description || null
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0]
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate ? updates.endDate.toISOString().split('T')[0] : null
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.cashBoxId !== undefined) updateData.cash_box_id = updates.cashBoxId || null
  if (updates.totalIncome !== undefined) updateData.total_income = updates.totalIncome
  if (updates.totalExpense !== undefined) updateData.total_expense = updates.totalExpense
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    startDate: parseDate(data.start_date)!,
    endDate: data.end_date ? parseDate(data.end_date) : undefined,
    status: data.status as Event['status'],
    cashBoxId: data.cash_box_id || undefined,
    totalIncome: Number(data.total_income) || 0,
    totalExpense: Number(data.total_expense) || 0,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}
