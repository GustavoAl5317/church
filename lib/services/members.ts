import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { Member } from '@/lib/types'

export async function getMembers() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase não está configurado. Por favor, configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env. Veja SETUP.md para instruções.'
    )
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name')

  if (error) throw error

  return data.map((member): Member => ({
    id: member.id,
    name: member.name,
    birthDate: member.birth_date ? parseDate(member.birth_date) : undefined,
    phone: member.phone || undefined,
    email: member.email || undefined,
    address: member.address || undefined,
    entryDate: parseDate(member.entry_date)!,
    status: member.status as Member['status'],
    ministries: member.ministries || [],
    observations: member.observations || undefined,
    createdAt: parseDate(member.created_at)!,
    updatedAt: parseDate(member.updated_at)!,
  }))
}

export async function getMember(id: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    birthDate: data.birth_date ? parseDate(data.birth_date) : undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    entryDate: parseDate(data.entry_date)!,
    status: data.status as Member['status'],
    ministries: data.ministries || [],
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function createMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: member.name,
      birth_date: member.birthDate ? member.birthDate.toISOString().split('T')[0] : null,
      phone: member.phone || null,
      email: member.email || null,
      address: member.address || null,
      entry_date: member.entryDate.toISOString().split('T')[0],
      status: member.status,
      ministries: member.ministries || [],
      observations: member.observations || null,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    birthDate: data.birth_date ? parseDate(data.birth_date) : undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    entryDate: parseDate(data.entry_date)!,
    status: data.status as Member['status'],
    ministries: data.ministries || [],
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function updateMember(id: string, updates: Partial<Member>) {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate ? updates.birthDate.toISOString().split('T')[0] : null
  if (updates.phone !== undefined) updateData.phone = updates.phone || null
  if (updates.email !== undefined) updateData.email = updates.email || null
  if (updates.address !== undefined) updateData.address = updates.address || null
  if (updates.entryDate !== undefined) updateData.entry_date = updates.entryDate.toISOString().split('T')[0]
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.ministries !== undefined) updateData.ministries = updates.ministries || []
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    birthDate: data.birth_date ? parseDate(data.birth_date) : undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    entryDate: parseDate(data.entry_date)!,
    status: data.status as Member['status'],
    ministries: data.ministries || [],
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function deleteMember(id: string) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)

  if (error) throw error
}
