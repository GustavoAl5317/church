import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { Service, ServiceTemplate, ServiceIncome } from '@/lib/types'

// Service Templates (Cultos Recorrentes)
export async function getServiceTemplates() {
  const { data, error } = await supabase
    .from('service_templates')
    .select('*')
    .order('name')

  if (error) throw error
  if (!data) return []

  return (data as any[]).map((template): ServiceTemplate => ({
    id: template.id,
    name: template.name,
    type: template.type,
    time: template.time,
    dayOfWeek: template.day_of_week,
    isRecurring: template.is_recurring,
    isActive: template.is_active,
    observations: template.observations || undefined,
    createdAt: parseDate(template.created_at)!,
    updatedAt: parseDate(template.updated_at)!,
  }))
}

export async function getActiveServiceTemplates() {
  const { data, error } = await supabase
    .from('service_templates')
    .select('*')
    .eq('is_active', true)
    .eq('is_recurring', true)
    .order('name')

  if (error) throw error
  if (!data) return []

  return (data as any[]).map((template): ServiceTemplate => ({
    id: template.id,
    name: template.name,
    type: template.type,
    time: template.time,
    dayOfWeek: template.day_of_week,
    isRecurring: template.is_recurring,
    isActive: template.is_active,
    observations: template.observations || undefined,
    createdAt: parseDate(template.created_at)!,
    updatedAt: parseDate(template.updated_at)!,
  }))
}

export async function createServiceTemplate(template: Omit<ServiceTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('service_templates')
    .insert({
      name: template.name,
      type: template.type,
      time: template.time,
      day_of_week: template.dayOfWeek ?? null,
      is_recurring: template.isRecurring,
      is_active: template.isActive,
      observations: template.observations || null,
    } as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create template')

  const result = data as any
  return {
    id: result.id,
    name: result.name,
    type: result.type,
    time: result.time,
    dayOfWeek: result.day_of_week,
    isRecurring: result.is_recurring,
    isActive: result.is_active,
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
    updatedAt: parseDate(result.updated_at)!,
  }
}

export async function updateServiceTemplate(id: string, updates: Partial<ServiceTemplate>) {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.time !== undefined) updateData.time = updates.time
  if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek ?? null
  if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('service_templates')
    // @ts-expect-error - Supabase type inference issue with dynamic updateData
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Template not found')

  const result = data as any
  return {
    id: result.id,
    name: result.name,
    type: result.type,
    time: result.time,
    dayOfWeek: result.day_of_week,
    isRecurring: result.is_recurring,
    isActive: result.is_active,
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
    updatedAt: parseDate(result.updated_at)!,
  }
}

export async function deleteServiceTemplate(id: string) {
  const { error } = await supabase
    .from('service_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Services (Cultos Individuais)
export async function getServices(startDate?: Date, endDate?: Date) {
  console.log('Buscando cultos no banco de dados...')
  console.log('Filtros:', { startDate, endDate })
  
  // Verificar se Supabase está configurado
  console.log('🔍 Verificando configuração do Supabase...', { isConfigured: isSupabaseConfigured })
  if (!isSupabaseConfigured) {
    console.error('❌ Supabase não está configurado!')
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env')
  }

  let query = supabase
    .from('services')
    .select('*')
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate.toISOString().split('T')[0])
  }
  if (endDate) {
    query = query.lte('date', endDate.toISOString().split('T')[0])
  }

  console.log('📡 Executando query no Supabase (tabela: services)...')
  const { data, error } = await query

  if (error) {
    console.error('❌ Erro do Supabase ao buscar cultos:', error)
    console.error('❌ Código do erro:', error.code)
    console.error('❌ Mensagem:', error.message)
    console.error('❌ Detalhes completos:', JSON.stringify(error, null, 2))
    throw new Error(`Erro ao buscar cultos: ${error.message}${error.code ? ` (Código: ${error.code})` : ''}`)
  }

  console.log('📊 Resposta do Supabase:', { 
    temDados: !!data, 
    quantidade: data?.length || 0,
    tipo: Array.isArray(data) ? 'array' : typeof data
  })

  if (!data) {
    console.warn('⚠️ Nenhum dado retornado do Supabase (data é null)')
    return []
  }

  if (data.length === 0) {
    console.log('ℹ️ Nenhum culto encontrado no banco de dados (tabela vazia)')
    return []
  }

  console.log(`✅ Encontrados ${data.length} culto(s) no banco`)
  console.log('📋 Primeiros cultos:', data.slice(0, 3))

  const services = (data as any[]).map((service): Service => {
    const parsedDate = parseDate(service.date)
    if (!parsedDate) {
      console.warn(`Data inválida para culto ${service.id}:`, service.date)
    }
    return {
      id: service.id,
      templateId: service.template_id || undefined,
      name: service.name,
      type: service.type,
      date: parsedDate || new Date(),
      time: service.time,
      status: service.status,
      observations: service.observations || undefined,
      totalIncome: Number(service.total_income) || 0,
      createdAt: parseDate(service.created_at) || new Date(),
      updatedAt: parseDate(service.updated_at) || new Date(),
    }
  })

  console.log(`✅ Processados ${services.length} culto(s) com sucesso`)
  if (services.length > 0) {
    console.log('📝 Exemplo de culto processado:', {
      id: services[0].id,
      name: services[0].name,
      date: services[0].date,
      status: services[0].status
    })
  }
  
  return services
}

export async function getService(id: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Service not found')

  const serviceData = data as any
  return {
    id: serviceData.id,
    templateId: serviceData.template_id || undefined,
    name: serviceData.name,
    type: serviceData.type,
    date: parseDate(serviceData.date)!,
    time: serviceData.time,
    status: serviceData.status,
    observations: serviceData.observations || undefined,
    totalIncome: serviceData.total_income,
    createdAt: parseDate(serviceData.created_at)!,
    updatedAt: parseDate(serviceData.updated_at)!,
  }
}

export async function createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>) {
  // Formatar data de forma segura, evitando problemas de timezone
  // Usar getFullYear, getMonth, getDate para garantir que usamos o dia correto no timezone local
  // Criar uma nova data no timezone local para garantir que não há conversão
  const localDate = new Date(service.date)
  // Garantir que estamos usando o timezone local
  const year = localDate.getFullYear()
  const month = localDate.getMonth() + 1
  const day = localDate.getDate()
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  // Formatar hora também de forma segura
  const timeStr = service.time
  
  const serviceData = {
    template_id: service.templateId || null,
    name: service.name,
    type: service.type,
    date: dateStr,
    time: timeStr,
    status: service.status || 'agendado',
    observations: service.observations || null,
    total_income: 0,
  }

  console.log('Criando culto:', serviceData)
  console.log(`📅 Data original: ${service.date.toLocaleDateString('pt-BR')} ${service.date.toLocaleTimeString('pt-BR')}`)
  console.log(`📅 Data formatada para banco: ${dateStr} ${timeStr}`)
  console.log(`📅 Dia da semana original: ${service.date.getDay()}`)

  const { data, error } = await supabase
    .from('services')
    .insert(serviceData as any)
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar culto:', error)
    throw new Error(`Erro ao criar culto: ${error.message}`)
  }

  if (!data) {
    throw new Error('Nenhum dado retornado ao criar culto')
  }

  console.log('Culto criado com sucesso:', data)

  const createdService = data as any
  return {
    id: createdService.id,
    templateId: createdService.template_id || undefined,
    name: createdService.name,
    type: createdService.type,
    date: parseDate(createdService.date)!,
    time: createdService.time,
    status: createdService.status,
    observations: createdService.observations || undefined,
    totalIncome: Number(createdService.total_income) || 0,
    createdAt: parseDate(createdService.created_at)!,
    updatedAt: parseDate(createdService.updated_at)!,
  }
}

export async function updateService(id: string, updates: Partial<Service>) {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0]
  if (updates.time !== undefined) updateData.time = updates.time
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.observations !== undefined) updateData.observations = updates.observations || null
  if (updates.totalIncome !== undefined) updateData.total_income = updates.totalIncome
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('services')
    // @ts-expect-error - Supabase type inference issue with dynamic updateData
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Service not found')

  const serviceData = data as any
  return {
    id: serviceData.id,
    templateId: serviceData.template_id || undefined,
    name: serviceData.name,
    type: serviceData.type,
    date: parseDate(serviceData.date)!,
    time: serviceData.time,
    status: serviceData.status,
    observations: serviceData.observations || undefined,
    totalIncome: serviceData.total_income,
    createdAt: parseDate(serviceData.created_at)!,
    updatedAt: parseDate(serviceData.updated_at)!,
  }
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Generate weekly services from templates
export async function generateWeeklyServices(weeksAhead: number = 4) {
  console.log('🔄 Iniciando geração de cultos semanais...')
  const templates = await getActiveServiceTemplates()
  console.log(`📋 Templates ativos encontrados: ${templates.length}`)
  
  if (templates.length === 0) {
    console.warn('⚠️ Nenhum template ativo encontrado')
    throw new Error('Nenhum template de culto ativo encontrado. Configure e ative pelo menos um template primeiro.')
  }

  // Criar data de hoje no timezone local, zerando horas para evitar problemas
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0)
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + (weeksAhead * 7))

  console.log(`📅 Período: ${today.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`)
  console.log(`📅 Hoje (ISO): ${today.toISOString().split('T')[0]}, Dia da semana: ${today.getDay()}`)

  const existingServices = await getServices(today, endDate)
  console.log(`📊 Cultos existentes no período: ${existingServices.length}`)
  
  const existingServiceKeys = new Set(
    existingServices.map(s => `${s.date.toISOString().split('T')[0]}_${s.time}_${s.type}`)
  )

  const newServices: Service[] = []

  for (const template of templates) {
    console.log(`🔄 Processando template: ${template.name} (dia ${template.dayOfWeek}, ${template.time})`)
    
    // Verificar se dayOfWeek é válido (pode ser 0 para domingo)
    if (template.dayOfWeek === null || template.dayOfWeek === undefined) {
      console.warn(`⚠️ Template ${template.name} não tem dayOfWeek definido, pulando...`)
      continue
    }

    // Calculate dates for this template
    // Garantir que dayOfWeek seja um número válido
    const targetDayOfWeek = typeof template.dayOfWeek === 'number' ? template.dayOfWeek : parseInt(String(template.dayOfWeek || 0))
    
    if (isNaN(targetDayOfWeek) || targetDayOfWeek < 0 || targetDayOfWeek > 6) {
      console.error(`❌ ERRO: dayOfWeek inválido para template ${template.name}: ${template.dayOfWeek}`)
      continue
    }
    
    // Usar a data de hoje já zerada
    const currentDate = new Date(today)
    
    // Garantir que estamos usando o dia correto
    const todayDayOfWeek = currentDate.getDay() // 0 = Domingo, 1 = Segunda, etc.
    console.log(`📅 Data atual completa: ${currentDate.toLocaleDateString('pt-BR')} ${currentDate.toLocaleTimeString('pt-BR')}`)
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    
    console.log(`📅 Hoje é: ${dayNames[todayDayOfWeek]} (${todayDayOfWeek}) - Data: ${currentDate.toLocaleDateString('pt-BR')}`)
    console.log(`📅 Template espera: ${dayNames[targetDayOfWeek]} (${targetDayOfWeek})`)
    
    // Calcular quantos dias até o próximo dia da semana desejado
    let daysUntilNext = targetDayOfWeek - todayDayOfWeek
    
    // Se o dia já passou esta semana (ou é hoje mas já passou o horário), ir para a próxima semana
    if (daysUntilNext < 0) {
      daysUntilNext += 7
    } else if (daysUntilNext === 0) {
      // Se é hoje, verificar se já passou o horário
      const now = new Date()
      const templateHour = parseInt(template.time.split(':')[0] || '0')
      if (now.getHours() >= templateHour) {
        daysUntilNext = 7 // Ir para a próxima semana
      }
    }
    
    console.log(`📅 Dias até o próximo ${dayNames[targetDayOfWeek]}: ${daysUntilNext}`)

    // Calcular a primeira data usando uma abordagem que evita problemas de timezone
    // Criar data usando componentes locais para evitar problemas de timezone
    const currentDay = currentDate.getDate()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    console.log(`📅 Data base: ${currentDay}/${currentMonth + 1}/${currentYear} (${dayNames[todayDayOfWeek]})`)
    console.log(`📅 Adicionando ${daysUntilNext} dias`)
    
    // Criar a data diretamente usando os componentes, evitando problemas de timezone
    // Calcular o dia do mês final
    const targetDayOfMonth = currentDay + daysUntilNext
    
    // Criar a data usando o construtor Date com ano, mês, dia
    const firstServiceDate = new Date(currentYear, currentMonth, targetDayOfMonth, 12, 0, 0, 0)
    
    // Verificar se a data calculada está no dia correto
    const calculatedDay = firstServiceDate.getDay()
    const calculatedDateStr = firstServiceDate.toLocaleDateString('pt-BR')
    const calculatedDayNum = firstServiceDate.getDate()
    
    console.log(`📅 Primeira data calculada: ${calculatedDateStr} - Dia do mês: ${calculatedDayNum} - Dia da semana: ${dayNames[calculatedDay]} (${calculatedDay})`)
    console.log(`📅 Esperado: Dia da semana ${dayNames[targetDayOfWeek]} (${targetDayOfWeek})`)
    console.log(`📅 Cálculo: Dia atual ${currentDay} + ${daysUntilNext} dias = ${targetDayOfMonth}`)
    
    // Verificar se o dia da semana está correto
    if (calculatedDay !== targetDayOfWeek) {
      console.error(`❌ ERRO: Data calculada está no dia ${calculatedDay} (${dayNames[calculatedDay]}) mas deveria estar no dia ${targetDayOfWeek} (${dayNames[targetDayOfWeek]})`)
      // Calcular a diferença e corrigir
      let correction = targetDayOfWeek - calculatedDay
      if (correction < 0) correction += 7
      if (correction > 0) {
        console.log(`🔧 Aplicando correção de ${correction} dias`)
        firstServiceDate.setDate(firstServiceDate.getDate() + correction)
        console.log(`🔧 Corrigido para: ${firstServiceDate.toLocaleDateString('pt-BR')} (${dayNames[firstServiceDate.getDay()]})`)
      }
    } else {
      console.log(`✅ Data calculada corretamente!`)
    }
    
    // Usar a data corrigida
    let currentServiceDate = new Date(firstServiceDate)

    let servicesCreatedForTemplate = 0
    while (currentServiceDate <= endDate) {
      // Verificar novamente se o dia está correto antes de criar
      const checkDay = currentServiceDate.getDay()
      if (checkDay !== targetDayOfWeek) {
        console.error(`❌ ERRO: Data ${currentServiceDate.toISOString().split('T')[0]} está no dia errado (${dayNames[checkDay]} em vez de ${dayNames[targetDayOfWeek]})`)
        // Corrigir
        const correction = targetDayOfWeek - checkDay
        currentServiceDate.setDate(currentServiceDate.getDate() + correction)
      }
      
      const serviceKey = `${currentServiceDate.toISOString().split('T')[0]}_${template.time}_${template.type}`
      
      if (!existingServiceKeys.has(serviceKey)) {
        try {
          // Criar uma nova data para evitar mutação
          // Usar os componentes da data diretamente para evitar problemas de timezone
          const serviceDate = new Date(currentServiceDate)
          
          // Garantir que estamos usando o timezone local
          // Criar uma nova data com os componentes locais
          const year = serviceDate.getFullYear()
          const month = serviceDate.getMonth()
          const day = serviceDate.getDate()
          const localServiceDate = new Date(year, month, day, 12, 0, 0, 0)
          
          // Verificar se o dia da semana está correto
          const dayOfWeekCheck = localServiceDate.getDay()
          if (dayOfWeekCheck !== targetDayOfWeek) {
            console.error(`❌ ERRO antes de criar: Data ${localServiceDate.toLocaleDateString('pt-BR')} está no dia ${dayNames[dayOfWeekCheck]} mas deveria estar no ${dayNames[targetDayOfWeek]}`)
            // Corrigir
            let correction = targetDayOfWeek - dayOfWeekCheck
            if (correction < 0) correction += 7
            localServiceDate.setDate(localServiceDate.getDate() + correction)
            console.log(`🔧 Corrigido para: ${localServiceDate.toLocaleDateString('pt-BR')} (${dayNames[localServiceDate.getDay()]})`)
          }
          
          // Formatar data para log
          const dateStr = localServiceDate.toLocaleDateString('pt-BR')
          const dayOfWeekStr = dayNames[localServiceDate.getDay()]
          console.log(`➕ Criando culto: ${template.name} em ${dateStr} (${dayOfWeekStr}) às ${template.time}`)
          
          const service = await createService({
            templateId: template.id,
            name: template.name,
            type: template.type,
            date: localServiceDate,
            time: template.time,
            status: 'agendado',
            observations: template.observations,
          })
          newServices.push(service)
          existingServiceKeys.add(serviceKey)
          servicesCreatedForTemplate++
          
          // Verificar a data retornada
          const returnedDate = new Date(service.date)
          console.log(`✅ Culto criado: ${service.id}`)
          console.log(`   Data retornada: ${returnedDate.toLocaleDateString('pt-BR')} (${dayNames[returnedDate.getDay()]})`)
          console.log(`   Hora: ${service.time}`)
        } catch (error) {
          console.error(`❌ Erro ao criar culto para ${template.name} em ${currentServiceDate.toISOString()}:`, error)
          throw error // Re-throw para que o usuário veja o erro
        }
      } else {
        console.log(`⏭️ Culto já existe: ${serviceKey}`)
      }

      // Avançar 7 dias para a próxima semana
      currentServiceDate.setDate(currentServiceDate.getDate() + 7)
    }
    console.log(`✅ Template ${template.name}: ${servicesCreatedForTemplate} culto(s) criado(s)`)
  }

  console.log(`✅ Total de cultos gerados: ${newServices.length}`)
  return newServices
}

// Service Incomes
export async function getServiceIncomes(serviceId: string) {
  const { data, error } = await supabase
    .from('service_incomes')
    .select('*')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as any[]).map((income): ServiceIncome => ({
    id: income.id,
    serviceId: income.service_id,
    type: income.type,
    amount: income.amount,
    paymentMethod: income.payment_method,
    observations: income.observations || undefined,
    createdAt: parseDate(income.created_at)!,
  }))
}

export async function createServiceIncome(income: Omit<ServiceIncome, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('service_incomes')
    .insert({
      service_id: income.serviceId,
      type: income.type,
      amount: income.amount,
      payment_method: income.paymentMethod,
      observations: income.observations || null,
    } as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create service income')

  // Update service total income
  const service = await getService(income.serviceId)
  const incomes = await getServiceIncomes(income.serviceId)
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  
  await updateService(income.serviceId, { totalIncome })

  // Criar transação de caixa automaticamente
  console.log(`💰 Iniciando criação de transação de caixa para income:`, {
    serviceId: income.serviceId,
    type: income.type,
    amount: income.amount,
    serviceName: service.name
  })
  
  try {
    const { getCashBoxes, createCashTransaction } = await import('./cash')
    console.log(`📦 Buscando caixas...`)
    const cashBoxes = await getCashBoxes()
    console.log(`📦 Caixas encontrados: ${cashBoxes.length}`, cashBoxes.map(c => ({ id: c.id, name: c.name, type: c.type })))
    
    const generalCashBox = cashBoxes.find((c) => c.type === 'geral')
    console.log(`📦 Caixa geral:`, generalCashBox ? { id: generalCashBox.id, name: generalCashBox.name, balance: generalCashBox.balance } : 'NÃO ENCONTRADO')
    
    if (!generalCashBox) {
      console.error('❌ ERRO: Caixa geral não encontrado! Não é possível criar transação de caixa.')
      throw new Error('Caixa geral não encontrado')
    }
    
    const incomeTypeLabels: Record<string, string> = {
      dizimo: 'Dízimo',
      oferta: 'Oferta',
      doacao: 'Doação',
      campanha: 'Campanha',
      outros: 'Outros',
    }
    
    // Usar a data atual para a transação de caixa (não a data do culto)
    // Isso garante que apareça no mês correto no dashboard
    const transactionDate = new Date()
    const year = transactionDate.getFullYear()
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0')
    const day = String(transactionDate.getDate()).padStart(2, '0')
    
    console.log(`💰 Criando transação de caixa:`, {
      amount: income.amount,
      date: `${day}/${month}/${year}`,
      cashBoxId: generalCashBox.id,
      description: `${incomeTypeLabels[income.type] || income.type} - ${service.name}`
    })
    
    const transaction = await createCashTransaction({
      cashBoxId: generalCashBox.id,
      type: 'entrada',
      category: 'Culto',
      description: `${incomeTypeLabels[income.type] || income.type} - ${service.name}`,
      amount: income.amount,
      paymentMethod: income.paymentMethod,
      date: transactionDate,
      relatedServiceId: income.serviceId,
      responsibleId: 'system',
      responsibleName: 'Sistema',
      observations: income.observations,
    })
    
    console.log(`✅ Transação de caixa criada com sucesso!`, {
      id: transaction.id,
      valor: transaction.amount,
      data: transaction.date.toLocaleDateString('pt-BR'),
      caixa: transaction.cashBoxId
    })
  } catch (cashError) {
    console.error('❌ ERRO ao criar transação de caixa:', cashError)
    console.error('❌ Stack trace:', cashError instanceof Error ? cashError.stack : 'N/A')
    // Não falhar a criação do income se a transação de caixa falhar
    // Mas vamos logar o erro para debug
  }

  const result = data as any
  return {
    id: result.id,
    serviceId: result.service_id,
    type: result.type,
    amount: result.amount,
    paymentMethod: result.payment_method,
    observations: result.observations || undefined,
    createdAt: parseDate(result.created_at)!,
  }
}

export async function deleteServiceIncome(id: string) {
  const { data: income } = await supabase
    .from('service_incomes')
    .select('service_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('service_incomes')
    .delete()
    .eq('id', id)

  if (error) throw error

  // Update service total income
  if (income) {
    const incomeData = income as any
    const incomes = await getServiceIncomes(incomeData.service_id)
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
    await updateService(incomeData.service_id, { totalIncome })
  }
}
