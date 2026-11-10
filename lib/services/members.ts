import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { Member } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type MemberRow = Database['public']['Tables']['members']['Row']
export type MemberInput = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>

function toDateOnly(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function mapMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date ? parseDate(row.birth_date) : undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    entryDate: parseDate(row.entry_date)!,
    status: row.status as Member['status'],
    // Bancos que ainda não rodaram a migração não têm estas colunas
    memberRole: (row.member_role as Member['memberRole']) || 'membro',
    baptized: row.baptized ?? false,
    ministries: row.ministries || [],
    observations: row.observations || undefined,
    createdAt: parseDate(row.created_at)!,
    updatedAt: parseDate(row.updated_at)!,
  }
}

function toRow(member: Partial<MemberInput>) {
  const row: Record<string, unknown> = {}
  if (member.name !== undefined) row.name = member.name.trim()
  if (member.birthDate !== undefined) row.birth_date = member.birthDate ? toDateOnly(member.birthDate) : null
  if (member.phone !== undefined) row.phone = member.phone?.trim() || null
  if (member.email !== undefined) row.email = member.email?.trim() || null
  if (member.address !== undefined) row.address = member.address?.trim() || null
  if (member.entryDate !== undefined) row.entry_date = toDateOnly(member.entryDate)
  if (member.status !== undefined) row.status = member.status
  if (member.memberRole !== undefined) row.member_role = member.memberRole
  if (member.baptized !== undefined) row.baptized = member.baptized
  if (member.ministries !== undefined) row.ministries = member.ministries || []
  if (member.observations !== undefined) row.observations = member.observations?.trim() || null
  return row
}

export async function getMembers() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não está configurado. Por favor, configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env. Veja SETUP.md para instruções.'
    )
  }

  const { data, error } = await supabase.from('members').select('*').order('name')

  if (error) throw error
  return (data || []).map(mapMember)
}

export async function getMember(id: string) {
  const { data, error } = await supabase.from('members').select('*').eq('id', id).single()

  if (error) throw error
  return mapMember(data)
}

export async function createMember(member: MemberInput) {
  const { data, error } = await supabase
    .from('members')
    .insert(toRow(member) as Database['public']['Tables']['members']['Insert'])
    .select()
    .single()

  if (error) throw error
  return mapMember(data)
}

export async function updateMember(id: string, updates: Partial<MemberInput>) {
  const { data, error } = await supabase
    .from('members')
    .update({ ...toRow(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapMember(data)
}

export async function deleteMember(id: string) {
  const { error } = await supabase.from('members').delete().eq('id', id)

  if (error) throw error
}
