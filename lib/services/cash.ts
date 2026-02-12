import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { CashBox, CashTransaction } from '@/lib/types'

/**
 * Garante que existe pelo menos um usuário no banco de dados.
 * Se não existir, cria um usuário do sistema automaticamente.
 * Retorna o ID e nome do usuário encontrado ou criado.
 */
async function ensureSystemUser(): Promise<{ id: string; name: string }> {
  // Primeiro, tenta buscar um usuário admin
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()
  
  if (adminError) {
    console.error('❌ Erro ao buscar usuário admin:', adminError)
  }
  
  if (adminUser) {
    return { id: adminUser.id, name: adminUser.name || 'Sistema' }
  }
  
  // Se não encontrou admin, busca qualquer usuário
  const { data: anyUser, error: anyUserError } = await supabase
    .from('users')
    .select('id, name')
    .limit(1)
    .maybeSingle()
  
  if (anyUserError) {
    console.error('❌ Erro ao buscar qualquer usuário:', anyUserError)
  }
  
  if (anyUser) {
    return { id: anyUser.id, name: anyUser.name || 'Sistema' }
  }
  
  // Se não encontrou nenhum usuário, verifica se o usuário do sistema já existe
  const { data: existingSystemUser } = await supabase
    .from('users')
    .select('id, name')
    .eq('email', 'sistema@igreja.local')
    .maybeSingle()
  
  if (existingSystemUser) {
    return { id: existingSystemUser.id, name: existingSystemUser.name || 'Sistema' }
  }
  
  // Se não encontrou nenhum usuário, cria um usuário do sistema
  console.log('⚠️ Nenhum usuário encontrado. Criando usuário do sistema...')
  
  const { data: systemUser, error: createError } = await supabase
    .from('users')
    .insert({
      name: 'Sistema',
      email: 'sistema@igreja.local',
      role: 'admin',
    } as any)
    .select('id, name')
    .single()
  
  if (createError) {
    console.error('❌ Erro ao criar usuário do sistema:', createError)
    console.error('❌ Código do erro:', createError.code)
    console.error('❌ Mensagem:', createError.message)
    console.error('❌ Detalhes:', createError.details)
    console.error('❌ Hint:', createError.hint)
    
    // Se falhou, tenta buscar novamente (pode ter sido criado por outra requisição)
    const { data: retryUser } = await supabase
      .from('users')
      .select('id, name')
      .limit(1)
      .maybeSingle()
    
    if (retryUser) {
      console.log('✅ Usuário encontrado após retry:', retryUser.id)
      return { id: retryUser.id, name: retryUser.name || 'Sistema' }
    }
    
    // Se ainda não encontrou, lança erro
    throw new Error(
      'Nenhum usuário encontrado no banco de dados. É necessário ter pelo menos um usuário cadastrado para criar transações do sistema. ' +
      'Erro ao criar usuário automático: ' + createError.message +
      (createError.details ? ' Detalhes: ' + createError.details : '') +
      (createError.hint ? ' Dica: ' + createError.hint : '')
    )
  }
  
  if (!systemUser) {
    throw new Error('Falha ao criar usuário do sistema: nenhum dado retornado')
  }
  
  console.log('✅ Usuário do sistema criado automaticamente:', systemUser.id)
  return { id: systemUser.id, name: systemUser.name || 'Sistema' }
}

export async function getCashBoxes() {
  if (!isSupabaseConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('cash_boxes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar caixas:', error)
      console.error('❌ Código:', error.code)
      console.error('❌ Mensagem:', error.message)
      return []
    }

    if (!data) {
      console.log('⚠️ Nenhum caixa encontrado no banco (data é null/undefined)')
    }

    let boxes: any[] = (data as any[]) || []
    console.log(`📦 Total de caixas retornados do banco: ${boxes.length}`)
    if (boxes.length > 0) {
      console.log(`📦 Caixas:`, boxes.map(b => ({ id: b.id, name: b.name, type: b.type })))
    }

    // Se não existe caixa geral, criar automaticamente
    const generalBox = boxes.find((b) => b.type === 'geral')
    if (!generalBox) {
      console.log('⚠️ Caixa geral não encontrado. Criando automaticamente...')
      try {
        const { data: newBox, error: createError } = await supabase
          .from('cash_boxes')
          .insert({
            name: 'Caixa Geral',
            type: 'geral',
            balance: 0,
            initial_balance: 0,
          } as any)
          .select()
          .single()

        if (createError) {
          console.error('❌ Erro ao criar caixa geral:', createError)
          console.error('❌ Código:', createError.code)
          console.error('❌ Mensagem:', createError.message)
          console.error('❌ Detalhes:', createError.details)
        } else if (newBox) {
          console.log('✅ Caixa geral criado com sucesso!', {
            id: newBox.id,
            name: newBox.name,
            type: newBox.type,
            balance: newBox.balance
          })
          boxes.push(newBox)
        } else {
          console.error('❌ Nenhum dado retornado ao criar caixa geral')
        }
      } catch (createError) {
        console.error('❌ Erro ao criar caixa geral (catch):', createError)
      }
    } else {
      console.log('✅ Caixa geral já existe:', { id: generalBox.id, name: generalBox.name, balance: generalBox.balance })
    }

    return boxes.map((box): CashBox => ({
      id: box.id,
      name: box.name,
      type: box.type as CashBox['type'],
      eventId: box.event_id || undefined,
      balance: Number(box.balance) || 0,
      initialBalance: Number(box.initial_balance) || 0,
      createdAt: parseDate(box.created_at)!,
      updatedAt: parseDate(box.updated_at)!,
    }))
  } catch (error) {
    console.error('Erro ao buscar caixas:', error)
    return []
  }
}

export async function getCashBox(id: string) {
  const { data, error } = await supabase
    .from('cash_boxes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    type: data.type as CashBox['type'],
    eventId: data.event_id || undefined,
    balance: Number(data.balance) || 0,
    initialBalance: Number(data.initial_balance) || 0,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function createCashBox(box: Omit<CashBox, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('cash_boxes')
    .insert({
      name: box.name,
      type: box.type,
      event_id: box.eventId || null,
      balance: box.balance || 0,
      initial_balance: box.initialBalance || 0,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    type: data.type as CashBox['type'],
    eventId: data.event_id || undefined,
    balance: Number(data.balance) || 0,
    initialBalance: Number(data.initial_balance) || 0,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function updateCashBox(id: string, updates: Partial<CashBox>) {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.eventId !== undefined) updateData.event_id = updates.eventId || null
  if (updates.balance !== undefined) updateData.balance = updates.balance
  if (updates.initialBalance !== undefined) updateData.initial_balance = updates.initialBalance
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('cash_boxes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    type: data.type as CashBox['type'],
    eventId: data.event_id || undefined,
    balance: Number(data.balance) || 0,
    initialBalance: Number(data.initial_balance) || 0,
    createdAt: parseDate(data.created_at)!,
    updatedAt: parseDate(data.updated_at)!,
  }
}

export async function getCashTransactions(cashBoxId?: string, startDate?: Date, endDate?: Date) {
  if (!isSupabaseConfigured) {
    console.log('⚠️ Supabase não configurado')
    return []
  }

  try {
    console.log(`🔍 Buscando transações:`, {
      cashBoxId: cashBoxId || 'TODAS',
      startDate: startDate ? startDate.toLocaleDateString('pt-BR') : 'NÃO DEFINIDA',
      endDate: endDate ? endDate.toLocaleDateString('pt-BR') : 'NÃO DEFINIDA'
    })
    
    let query = supabase
      .from('cash_transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (cashBoxId) {
      query = query.eq('cash_box_id', cashBoxId)
      console.log(`🔍 Filtrando por cash_box_id: ${cashBoxId}`)
    } else {
      console.log(`⚠️ Nenhum cashBoxId fornecido, buscando todas as transações`)
    }
    if (startDate) {
      // Formatar data de forma segura para evitar problemas de timezone
      const year = startDate.getFullYear()
      const month = String(startDate.getMonth() + 1).padStart(2, '0')
      const day = String(startDate.getDate()).padStart(2, '0')
      const startDateStr = `${year}-${month}-${day}`
      query = query.gte('date', startDateStr)
      console.log(`🔍 Buscando transações a partir de: ${startDateStr}`)
    }
    if (endDate) {
      // Formatar data de forma segura para evitar problemas de timezone
      const year = endDate.getFullYear()
      const month = String(endDate.getMonth() + 1).padStart(2, '0')
      const day = String(endDate.getDate()).padStart(2, '0')
      const endDateStr = `${year}-${month}-${day}`
      query = query.lte('date', endDateStr)
      console.log(`🔍 Buscando transações até: ${endDateStr}`)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('❌ Erro na query de transações:', error)
    } else {
      console.log(`📊 Query retornou ${data?.length || 0} transações`)
      if (data && data.length > 0) {
        console.log(`📊 Primeiras transações:`, data.slice(0, 3).map((t: any) => ({
          id: t.id,
          date: t.date,
          type: t.type,
          amount: t.amount,
          description: t.description,
          cash_box_id: t.cash_box_id
        })))
      } else {
        // Se não encontrou transações, vamos verificar se existem transações sem filtro
        // Se não encontrou transações, vamos verificar se existem transações sem filtro
        console.log(`⚠️ Nenhuma transação encontrada com os filtros aplicados. Verificando se existem transações no banco...`)
        const { data: allData } = await supabase
          .from('cash_transactions')
          .select('id, date, type, amount, cash_box_id')
          .limit(5)
        console.log(`📊 Total de transações no banco (sem filtros): ${allData?.length || 0}`)
        if (allData && allData.length > 0) {
          console.log(`📊 Exemplos de transações no banco:`, allData)
        }
      }
    }

    if (error) {
      console.error('Erro ao buscar transações:', error)
      return []
    }

    if (!data) {
      return []
    }

    return (data as any[]).map((transaction): CashTransaction => ({
    id: transaction.id,
    cashBoxId: transaction.cash_box_id,
    type: transaction.type as CashTransaction['type'],
    category: transaction.category,
    description: transaction.description,
    amount: Number(transaction.amount) || 0,
    paymentMethod: transaction.payment_method as CashTransaction['paymentMethod'],
    date: parseDate(transaction.date)!,
    relatedServiceId: transaction.related_service_id || undefined,
    relatedBillId: transaction.related_bill_id || undefined,
    relatedTransferId: transaction.related_transfer_id || undefined,
    responsibleId: transaction.responsible_id,
    responsibleName: transaction.responsible_name,
    observations: transaction.observations || undefined,
    createdAt: parseDate(transaction.created_at)!,
  }))
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return []
  }
}

export async function getCashTransaction(id: string) {
  const { data, error } = await supabase
    .from('cash_transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Transaction not found')

  const transaction = data as any
  return {
    id: transaction.id,
    cashBoxId: data.cash_box_id,
    type: data.type as CashTransaction['type'],
    category: data.category,
    description: data.description,
    amount: Number(data.amount) || 0,
    paymentMethod: data.payment_method as CashTransaction['paymentMethod'],
    date: parseDate(data.date)!,
    relatedServiceId: data.related_service_id || undefined,
    relatedBillId: data.related_bill_id || undefined,
    relatedTransferId: data.related_transfer_id || undefined,
    responsibleId: data.responsible_id,
    responsibleName: data.responsible_name,
    observations: data.observations || undefined,
    createdAt: parseDate(data.created_at)!,
  }
}

export async function createCashTransaction(transaction: Omit<CashTransaction, 'id' | 'createdAt'>) {
  // Formatar data de forma segura
  const year = transaction.date.getFullYear()
  const month = String(transaction.date.getMonth() + 1).padStart(2, '0')
  const day = String(transaction.date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  // Handle 'system' responsibleId - database requires a valid user UUID from users table
  // Use ensureSystemUser to get or create a system user
  let responsibleId = transaction.responsibleId
  let responsibleName = transaction.responsibleName
  if (transaction.responsibleId === 'system') {
    try {
      const systemUser = await ensureSystemUser()
      responsibleId = systemUser.id
      responsibleName = systemUser.name
      console.log('✅ Usando usuário para transação do sistema:', systemUser.id, systemUser.name)
    } catch (error) {
      console.error('❌ Erro ao buscar/criar usuário para transação do sistema:', error)
      // Re-throw the error with more context
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Erro desconhecido ao buscar/criar usuário para transação do sistema: ' + String(error))
      }
    }
  }

  const transactionData = {
    cash_box_id: transaction.cashBoxId,
    type: transaction.type,
    category: transaction.category,
    description: transaction.description,
    amount: transaction.amount,
    payment_method: transaction.paymentMethod,
    date: dateStr,
    related_service_id: transaction.relatedServiceId || null,
    related_bill_id: transaction.relatedBillId || null,
    related_transfer_id: transaction.relatedTransferId || null,
    responsible_id: responsibleId,
    responsible_name: responsibleName,
    observations: transaction.observations || null,
  }

  console.log(`💾 Salvando transação no banco:`, transactionData)

  const { data, error } = await supabase
    .from('cash_transactions')
    .insert(transactionData as any)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao criar transação:', error)
    console.error('❌ Código do erro:', error.code)
    console.error('❌ Mensagem do erro:', error.message)
    console.error('❌ Detalhes do erro:', error.details)
    console.error('❌ Hint do erro:', error.hint)
    throw error
  }
  if (!data) {
    console.error('❌ Nenhum dado retornado ao criar transação')
    throw new Error('Failed to create transaction')
  }
  
  console.log(`✅ Transação salva no banco com sucesso!`, {
    id: data.id,
    date: data.date,
    amount: data.amount,
    type: data.type,
    cash_box_id: data.cash_box_id
  })

  // Update cash box balance
  const cashBox = await getCashBox(transaction.cashBoxId)
  const newBalance = transaction.type === 'entrada' 
    ? cashBox.balance + transaction.amount
    : transaction.type === 'saida'
    ? cashBox.balance - transaction.amount
    : cashBox.balance
  
  await updateCashBox(transaction.cashBoxId, { balance: newBalance })

  const result = data as any
  return {
    id: result.id,
    cashBoxId: result.cash_box_id,
    type: result.type as CashTransaction['type'],
    category: result.category,
    description: result.description,
    amount: Number(result.amount) || 0,
    paymentMethod: result.payment_method as CashTransaction['paymentMethod'],
    date: parseDate(result.date)!,
    relatedServiceId: result.related_service_id || undefined,
    relatedBillId: result.related_bill_id || undefined,
    relatedTransferId: result.related_transfer_id || undefined,
    responsibleId: result.responsible_id,
    responsibleName: result.responsible_name,
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
  }
}

export async function updateCashTransaction(id: string, updates: Partial<CashTransaction>) {
  const transaction = await getCashTransaction(id)
  
  const updateData: any = {}
  
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  if (updates.date !== undefined) {
    const year = updates.date.getFullYear()
    const month = String(updates.date.getMonth() + 1).padStart(2, '0')
    const day = String(updates.date.getDate()).padStart(2, '0')
    updateData.date = `${year}-${month}-${day}`
  }

  const { data, error } = await supabase
    .from('cash_transactions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Transaction not found')

  // Se o valor mudou, atualizar o saldo do caixa
  if (updates.amount !== undefined && updates.amount !== transaction.amount) {
    const cashBox = await getCashBox(transaction.cashBoxId)
    const oldAmount = transaction.amount
    const newAmount = updates.amount
    const difference = newAmount - oldAmount
    
    const newBalance = transaction.type === 'entrada'
      ? cashBox.balance + difference
      : transaction.type === 'saida'
      ? cashBox.balance - difference
      : cashBox.balance
    
    await updateCashBox(transaction.cashBoxId, { balance: newBalance })
  }

  const result = data as any
  return {
    id: result.id,
    cashBoxId: result.cash_box_id,
    type: result.type as CashTransaction['type'],
    category: result.category,
    description: result.description,
    amount: Number(result.amount) || 0,
    paymentMethod: result.payment_method as CashTransaction['paymentMethod'],
    date: parseDate(result.date)!,
    relatedServiceId: result.related_service_id || undefined,
    relatedBillId: result.related_bill_id || undefined,
    relatedTransferId: result.related_transfer_id || undefined,
    responsibleId: result.responsible_id,
    responsibleName: result.responsible_name,
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
  }
}

export async function deleteCashTransaction(id: string) {
  const transaction = await getCashTransaction(id)
  
  const { error } = await supabase
    .from('cash_transactions')
    .delete()
    .eq('id', id)

  if (error) throw error

  // Revert cash box balance
  const cashBox = await getCashBox(transaction.cashBoxId)
  const newBalance = transaction.type === 'entrada' 
    ? cashBox.balance - transaction.amount
    : transaction.type === 'saida'
    ? cashBox.balance + transaction.amount
    : cashBox.balance
  
  await updateCashBox(transaction.cashBoxId, { balance: newBalance })
}
