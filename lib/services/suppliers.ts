import { supabase, parseDate } from '@/lib/supabase'
import type { Supplier } from '@/lib/types'

export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  if (error) throw error

  return data.map((supplier): Supplier => ({
    id: supplier.id,
    name: supplier.name,
    contact: supplier.contact || undefined,
    phone: supplier.phone || undefined,
    email: supplier.email || undefined,
    category: supplier.category,
    observations: supplier.observations || undefined,
    createdAt: parseDate(supplier.created_at)!,
    updatedAt: parseDate(supplier.updated_at)!,
  }))
}

export async function getSupplier(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    contact: data.contact || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    category: data.category,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      name: supplier.name,
      contact: supplier.contact || null,
      phone: supplier.phone || null,
      email: supplier.email || null,
      category: supplier.category,
      observations: supplier.observations || null,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    contact: data.contact || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    category: data.category,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function updateSupplier(id: string, updates: Partial<Supplier>) {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.contact !== undefined) updateData.contact = updates.contact || null
  if (updates.phone !== undefined) updateData.phone = updates.phone || null
  if (updates.email !== undefined) updateData.email = updates.email || null
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('suppliers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    contact: data.contact || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    category: data.category,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) throw error
}
