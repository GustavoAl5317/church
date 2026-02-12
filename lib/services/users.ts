import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@/lib/types'
import { hashPassword, verifyPassword } from '@/lib/crypto'

// Credenciais padrão do admin (pode ser alterado depois)
const DEFAULT_ADMIN_EMAIL = 'admin@livresouemcristo.com.br'
const DEFAULT_ADMIN_PASSWORD = 'admin123'
const DEFAULT_ADMIN_NAME = 'Administrador'

// Armazena hashes de senha em memória (em produção, usar banco de dados ou tabela separada)
// TODO: Criar tabela user_passwords no banco de dados para armazenar hashes
const passwordHashes = new Map<string, string>()

/**
 * Garante que existe um usuário admin padrão no banco de dados
 */
export async function ensureDefaultAdmin() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Não é possível criar usuário admin padrão.')
    return null
  }

  try {
    // Verifica se já existe um usuário admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', DEFAULT_ADMIN_EMAIL)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Erro ao verificar usuário admin:', checkError)
      return null
    }

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe:', existingAdmin.id)
      return {
        id: existingAdmin.id,
        name: existingAdmin.name,
        email: existingAdmin.email,
      }
    }

    // Cria o usuário admin padrão
    console.log('⚠️ Criando usuário admin padrão...')
    const { data: newAdmin, error: createError } = await supabase
      .from('users')
      .insert({
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_EMAIL,
        role: 'admin',
      } as any)
      .select('id, name, email')
      .single()

    if (createError) {
      console.error('❌ Erro ao criar usuário admin:', createError)
      console.error('❌ Código:', createError.code)
      console.error('❌ Mensagem:', createError.message)
      console.error('❌ Detalhes:', createError.details)
      return null
    }

    if (!newAdmin) {
      console.error('❌ Nenhum dado retornado ao criar usuário admin')
      return null
    }

    // Cria hash da senha padrão
    const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD)
    passwordHashes.set(newAdmin.id, passwordHash)

    console.log('✅ Usuário admin criado com sucesso:', newAdmin.id)
    console.log(`📧 Email: ${DEFAULT_ADMIN_EMAIL}`)
    console.log(`🔑 Senha: ${DEFAULT_ADMIN_PASSWORD}`)
    return {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
    }
  } catch (error) {
    console.error('❌ Erro ao garantir usuário admin:', error)
    return null
  }
}

/**
 * Autentica um usuário usando email e senha com hash seguro
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  // Garante que o admin padrão existe
  await ensureDefaultAdmin()

  // Busca o usuário pelo email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) {
    console.error('❌ Erro ao buscar usuário:', error)
    throw new Error('Erro ao autenticar usuário')
  }

  if (!user) {
    return null
  }

  // Verifica senha usando hash
  const storedHash = passwordHashes.get(user.id)
  let passwordValid = false

  if (storedHash) {
    // Verifica usando hash armazenado
    passwordValid = await verifyPassword(password, storedHash)
  } else {
    // Fallback: para compatibilidade com usuários antigos ou admin padrão
    // Se não há hash, verifica senha padrão do admin
    if (user.email === DEFAULT_ADMIN_EMAIL) {
      passwordValid = password === DEFAULT_ADMIN_PASSWORD
      // Se a senha está correta, cria e armazena o hash
      if (passwordValid) {
        const newHash = await hashPassword(password)
        passwordHashes.set(user.id, newHash)
      }
    } else {
      // Para outros usuários sem hash, rejeita (segurança)
      return null
    }
  }

  if (!passwordValid) {
    return null
  }

  // Atualiza o último login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as User['role'],
    avatar: user.avatar || undefined,
    createdAt: parseDate(user.created_at)!,
    lastLogin: parseDate(user.last_login) || undefined,
  }
}

/**
 * Busca um usuário pelo ID
 */
export async function getUserById(id: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as User['role'],
    avatar: data.avatar || undefined,
    createdAt: parseDate(data.created_at)!,
    lastLogin: parseDate(data.last_login) || undefined,
  }
}

/**
 * Busca um usuário pelo email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as User['role'],
    avatar: data.avatar || undefined,
    createdAt: parseDate(data.created_at)!,
    lastLogin: parseDate(data.last_login) || undefined,
  }
}

/**
 * Lista todos os usuários
 */
export async function getUsers(): Promise<User[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (error) throw error
  if (!data) return []

  return data.map((user): User => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as User['role'],
    avatar: user.avatar || undefined,
    createdAt: parseDate(user.created_at)!,
    lastLogin: parseDate(user.last_login) || undefined,
  }))
}

/**
 * Cria um novo usuário com senha
 */
export async function createUser(
  user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>,
  password?: string
): Promise<User> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: user.name,
      email: user.email.toLowerCase().trim(),
      role: user.role,
      avatar: user.avatar || null,
    } as any)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create user')

  // Se senha fornecida, cria hash e armazena
  if (password) {
    const passwordHash = await hashPassword(password)
    passwordHashes.set(data.id, passwordHash)
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as User['role'],
    avatar: data.avatar || undefined,
    createdAt: parseDate(data.created_at)!,
    lastLogin: parseDate(data.last_login) || undefined,
  }
}

/**
 * Atualiza a senha de um usuário
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword)
  passwordHashes.set(userId, passwordHash)
}

/**
 * Atualiza um usuário
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.email !== undefined) updateData.email = updates.email.toLowerCase().trim()
  if (updates.role !== undefined) updateData.role = updates.role
  if (updates.avatar !== undefined) updateData.avatar = updates.avatar || null

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('User not found')

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as User['role'],
    avatar: data.avatar || undefined,
    createdAt: parseDate(data.created_at)!,
    lastLogin: parseDate(data.last_login) || undefined,
  }
}

/**
 * Deleta um usuário
 */
export async function deleteUser(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}
