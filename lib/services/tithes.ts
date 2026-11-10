import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { Tithe } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type TitheRow = Database['public']['Tables']['tithes']['Row']
export type TitheInput = Omit<Tithe, 'id' | 'createdAt' | 'updatedAt'>

function toDateOnly(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function mapTithe(row: TitheRow): Tithe {
  return {
    id: row.id,
    memberId: row.member_id || undefined,
    memberName: row.member_name,
    type: row.type,
    amount: Number(row.amount) || 0,
    date: parseDate(row.date)!,
    paymentMethod: row.payment_method,
    status: row.status,
    observations: row.observations || undefined,
    createdAt: parseDate(row.created_at)!,
    updatedAt: parseDate(row.updated_at)!,
  }
}

function toRow(tithe: Partial<TitheInput>) {
  const row: Record<string, unknown> = {}
  if (tithe.memberId !== undefined) row.member_id = tithe.memberId || null
  if (tithe.memberName !== undefined) row.member_name = tithe.memberName.trim()
  if (tithe.type !== undefined) row.type = tithe.type
  if (tithe.amount !== undefined) row.amount = tithe.amount
  if (tithe.date !== undefined) row.date = toDateOnly(tithe.date)
  if (tithe.paymentMethod !== undefined) row.payment_method = tithe.paymentMethod
  if (tithe.status !== undefined) row.status = tithe.status
  if (tithe.observations !== undefined) row.observations = tithe.observations?.trim() || null
  return row
}

export async function getTithes(startDate?: Date, endDate?: Date): Promise<Tithe[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  let query = supabase.from('tithes').select('*').order('date', { ascending: false })
  if (startDate) query = query.gte('date', toDateOnly(startDate))
  if (endDate) query = query.lte('date', toDateOnly(endDate))

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapTithe)
}

export async function createTithe(tithe: TitheInput): Promise<Tithe> {
  const { data, error } = await supabase
    .from('tithes')
    .insert(toRow(tithe) as Database['public']['Tables']['tithes']['Insert'])
    .select()
    .single()

  if (error) throw error
  return mapTithe(data)
}

export async function updateTithe(id: string, updates: Partial<TitheInput>): Promise<Tithe> {
  const { data, error } = await supabase
    .from('tithes')
    .update({ ...toRow(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapTithe(data)
}

export async function deleteTithe(id: string): Promise<void> {
  const { error } = await supabase.from('tithes').delete().eq('id', id)
  if (error) throw error
}
