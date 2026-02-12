import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { BillPayable } from '@/lib/types'
import { isPast } from 'date-fns'

export async function getBillsPayable(status?: string) {
  if (!isSupabaseConfigured) {
    return []
  }

  try {
    let query = supabase
      .from('bills_payable')
      .select('*')
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar contas a pagar:', error)
    console.error('Código do erro:', error.code)
    console.error('Mensagem:', error.message)
    console.error('Detalhes:', error.details)
    console.error('Hint:', error.hint)
    return []
  }

  if (!data) {
    return []
  }

  const bills = (data as any[]).map((bill): BillPayable => ({
    id: bill.id,
    supplierId: bill.supplier_id || undefined,
    supplierName: bill.supplier_name || undefined,
    description: bill.description,
    amount: Number(bill.amount) || 0,
    dueDate: parseDate(bill.due_date)!,
    paidDate: bill.paid_date ? parseDate(bill.paid_date) : undefined,
    recurrence: bill.recurrence as BillPayable['recurrence'] || undefined,
    category: bill.category as BillPayable['category'],
    costCenter: bill.cost_center as BillPayable['costCenter'],
    eventId: bill.event_id || undefined,
    paymentMethod: bill.payment_method as BillPayable['paymentMethod'] || undefined,
    status: bill.status as BillPayable['status'],
    observations: bill.observations || undefined,
    createdAt: parseDate(bill.created_at)!,
    updatedAt: parseDate(bill.updated_at)!,
  }))

    // Update status to 'atrasado' if past due date and status is 'pendente'
    for (const bill of bills) {
      if (bill.status === 'pendente' && isPast(bill.dueDate)) {
        try {
          await updateBillPayable(bill.id, { status: 'atrasado' })
          bill.status = 'atrasado'
        } catch (error) {
          console.error('Erro ao atualizar status da conta:', error)
        }
      }
    }

    return bills
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error)
    return []
  }
}

export async function getBillPayable(id: string) {
  const { data, error } = await supabase
    .from('bills_payable')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Bill not found')

  const bill = data as any
  return {
    id: bill.id,
    supplierId: data.supplier_id || undefined,
    supplierName: data.supplier_name || undefined,
    description: data.description,
    amount: Number(data.amount) || 0,
    dueDate: parseDate(data.due_date)!,
    paidDate: data.paid_date ? parseDate(data.paid_date) : undefined,
    recurrence: data.recurrence as BillPayable['recurrence'] || undefined,
    category: data.category as BillPayable['category'],
    costCenter: data.cost_center as BillPayable['costCenter'],
    eventId: data.event_id || undefined,
    paymentMethod: data.payment_method as BillPayable['paymentMethod'] || undefined,
    status: data.status as BillPayable['status'],
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function createBillPayable(bill: Omit<BillPayable, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('bills_payable')
    .insert({
      supplier_id: bill.supplierId || null,
      supplier_name: bill.supplierName || null,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate.toISOString().split('T')[0],
      paid_date: bill.paidDate ? bill.paidDate.toISOString().split('T')[0] : null,
      recurrence: bill.recurrence || null,
      category: bill.category,
      cost_center: bill.costCenter || 'geral',
      event_id: bill.eventId || null,
      payment_method: bill.paymentMethod || null,
      status: bill.status || 'pendente',
      observations: bill.observations || null,
    } as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create bill')

  const result = data as any
  return {
    id: result.id,
    supplierId: result.supplier_id || undefined,
    supplierName: result.supplier_name || undefined,
    description: result.description,
    amount: Number(result.amount) || 0,
    dueDate: parseDate(result.due_date)!,
    paidDate: result.paid_date ? parseDate(result.paid_date) : undefined,
    recurrence: result.recurrence as BillPayable['recurrence'] || undefined,
    category: result.category as BillPayable['category'],
    costCenter: result.cost_center as BillPayable['costCenter'],
    eventId: result.event_id || undefined,
    paymentMethod: result.payment_method as BillPayable['paymentMethod'] || undefined,
    status: result.status as BillPayable['status'],
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
    updatedAt: parseDate(result.updated_at)!,
  }
}

export async function updateBillPayable(id: string, updates: Partial<BillPayable>) {
  const updateData: any = {}
  
  if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId || null
  if (updates.supplierName !== undefined) updateData.supplier_name = updates.supplierName || null
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate.toISOString().split('T')[0]
  if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate ? updates.paidDate.toISOString().split('T')[0] : null
  if (updates.recurrence !== undefined) updateData.recurrence = updates.recurrence || null
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.costCenter !== undefined) updateData.cost_center = updates.costCenter
  if (updates.eventId !== undefined) updateData.event_id = updates.eventId || null
  if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod || null
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('bills_payable')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Bill not found')

  const result = data as any
  return {
    id: result.id,
    supplierId: result.supplier_id || undefined,
    supplierName: result.supplier_name || undefined,
    description: result.description,
    amount: Number(result.amount) || 0,
    dueDate: parseDate(result.due_date)!,
    paidDate: result.paid_date ? parseDate(result.paid_date) : undefined,
    recurrence: result.recurrence as BillPayable['recurrence'] || undefined,
    category: result.category as BillPayable['category'],
    costCenter: result.cost_center as BillPayable['costCenter'],
    eventId: result.event_id || undefined,
    paymentMethod: result.payment_method as BillPayable['paymentMethod'] || undefined,
    status: result.status as BillPayable['status'],
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
    updatedAt: parseDate(result.updated_at)!,
  }
}

export async function deleteBillPayable(id: string) {
  const { error } = await supabase
    .from('bills_payable')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Gera contas recorrentes baseadas em uma conta pai
 * @param parentBillId ID da conta pai (original)
 * @param count Quantidade de períodos a gerar (ex: 12 meses, 12 semanas, 12 anos)
 */
export async function generateRecurringBills(parentBillId: string, count: number = 12) {
  const parentBill = await getBillPayable(parentBillId)
  
  if (!parentBill.recurrence || parentBill.recurrence === 'unica') {
    throw new Error('Conta não é recorrente')
  }

  const newBills: Omit<BillPayable, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const today = new Date()
  
  // Busca a última conta gerada com a mesma descrição, categoria e recorrência
  const { data: existingBills } = await supabase
    .from('bills_payable')
    .select('due_date')
    .eq('description', parentBill.description)
    .eq('recurrence', parentBill.recurrence)
    .eq('category', parentBill.category)
    .order('due_date', { ascending: false })
    .limit(1)

  // Determina a data inicial (última conta gerada ou a conta pai)
  let startDate = new Date(parentBill.dueDate)
  if (existingBills && existingBills.length > 0) {
    const lastDate = parseDate(existingBills[0].due_date)
    if (lastDate && lastDate > startDate) {
      startDate = lastDate
    }
  }

  // Gera as próximas contas
  for (let i = 1; i <= count; i++) {
    const nextDate = new Date(startDate)
    
    switch (parentBill.recurrence) {
      case 'semanal':
        nextDate.setDate(startDate.getDate() + (7 * i))
        break
      case 'mensal':
        // Adiciona i meses
        const targetMonth = startDate.getMonth() + i
        const targetYear = startDate.getFullYear() + Math.floor(targetMonth / 12)
        const finalMonth = targetMonth % 12
        nextDate.setFullYear(targetYear, finalMonth, startDate.getDate())
        
        // Se o dia não existe no mês (ex: 31 de janeiro -> fevereiro), ajusta para o último dia do mês
        if (nextDate.getDate() !== startDate.getDate()) {
          nextDate.setDate(0) // Vai para o último dia do mês anterior
        }
        break
      case 'anual':
        nextDate.setFullYear(startDate.getFullYear() + i)
        // Ajusta para o mesmo dia do mês, se possível
        if (nextDate.getDate() !== startDate.getDate()) {
          nextDate.setDate(0) // Vai para o último dia do mês anterior
        }
        break
    }

    // Só gera contas futuras (pelo menos 1 dia no futuro)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    if (nextDate >= tomorrow) {
      // Verifica se a conta já não existe
      const dateStr = nextDate.toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('bills_payable')
        .select('id')
        .eq('description', parentBill.description)
        .eq('due_date', dateStr)
        .eq('recurrence', parentBill.recurrence)
        .maybeSingle()

      if (!existing) {
        newBills.push({
          supplierId: parentBill.supplierId,
          supplierName: parentBill.supplierName,
          description: parentBill.description,
          amount: parentBill.amount,
          dueDate: nextDate,
          recurrence: parentBill.recurrence,
          category: parentBill.category,
          costCenter: parentBill.costCenter,
          eventId: parentBill.eventId,
          paymentMethod: parentBill.paymentMethod,
          status: 'pendente',
          observations: parentBill.observations,
        })
      }
    }
  }

  // Insere todas as contas de uma vez
  if (newBills.length > 0) {
    const billsToInsert = newBills.map(bill => ({
      supplier_id: bill.supplierId || null,
      supplier_name: bill.supplierName || null,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate.toISOString().split('T')[0],
      paid_date: null,
      recurrence: bill.recurrence || null,
      category: bill.category,
      cost_center: bill.costCenter || 'geral',
      event_id: bill.eventId || null,
      payment_method: bill.paymentMethod || null,
      status: bill.status || 'pendente',
      observations: bill.observations || null,
    }))

    const { error } = await supabase
      .from('bills_payable')
      .insert(billsToInsert as any)

    if (error) {
      console.error('Erro ao gerar contas recorrentes:', error)
      throw error
    }

    console.log(`✅ ${newBills.length} conta(s) recorrente(s) gerada(s)`)
  }

  return newBills.length
}
