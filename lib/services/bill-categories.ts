import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'

export interface BillCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Busca todas as categorias ativas
 */
export async function getBillCategories(includeInactive: boolean = false): Promise<BillCategory[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  try {
    let query = supabase
      .from('bill_categories')
      .select('*')
      .order('name', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return []
    }

    if (!data) {
      return []
    }

    return data.map((cat): BillCategory => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || undefined,
      isActive: cat.is_active,
      createdAt: parseDate(cat.created_at)!,
      updatedAt: parseDate(cat.updated_at)!,
    }))
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
}

/**
 * Busca uma categoria por ID
 */
export async function getBillCategory(id: string): Promise<BillCategory | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('bill_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    isActive: data.is_active,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

/**
 * Cria uma nova categoria
 */
export async function createBillCategory(category: Omit<BillCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BillCategory> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  const { data, error } = await supabase
    .from('bill_categories')
    .insert({
      name: category.name.trim(),
      description: category.description || null,
      is_active: category.isActive !== false,
    } as any)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Já existe uma categoria com este nome')
    }
    throw error
  }
  if (!data) throw new Error('Failed to create category')

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    isActive: data.is_active,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

/**
 * Atualiza uma categoria
 */
export async function updateBillCategory(id: string, updates: Partial<BillCategory>): Promise<BillCategory> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name.trim()
  if (updates.description !== undefined) updateData.description = updates.description || null
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive

  const { data, error } = await supabase
    .from('bill_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Já existe uma categoria com este nome')
    }
    throw error
  }
  if (!data) throw new Error('Category not found')

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    isActive: data.is_active,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

/**
 * Deleta uma categoria (soft delete - desativa)
 */
export async function deleteBillCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  // Verifica se há contas usando esta categoria
  const { data: bills, error: checkError } = await supabase
    .from('bills_payable')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (checkError) {
    throw checkError
  }

  if (bills && bills.length > 0) {
    // Se há contas usando, apenas desativa
    await updateBillCategory(id, { isActive: false })
  } else {
    // Se não há contas usando, pode deletar
    const { error } = await supabase
      .from('bill_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
