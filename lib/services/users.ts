import { supabase, parseDate, isSupabaseConfigured } from '@/lib/supabase'
import type { PasswordResetRequest, User } from '@/lib/types'
import { hashPassword, verifyPassword } from '@/lib/crypto'

// Administrador criado na primeira execução. Troque a senha em "Meu Perfil" após o primeiro acesso.
export const DEFAULT_ADMIN_EMAIL = 'admin@livresouemcristo.com.br'
const DEFAULT_ADMIN_PASSWORD = 'admin123'
const DEFAULT_ADMIN_NAME = 'Administrador'

export const MIN_PASSWORD_LENGTH = 6

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  is_active?: boolean | null
  created_at: string
  last_login: string | null
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User['role'],
    avatar: row.avatar || undefined,
    // Bancos que ainda não rodaram a migração não têm a coluna: considera ativo
    isActive: row.is_active !== false,
    createdAt: parseDate(row.created_at)!,
    lastLogin: parseDate(row.last_login) || undefined,
  }
}

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não está configurado')
  }
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

async function getPasswordHash(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_passwords')
    .select('password_hash')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.password_hash ?? null
}

/**
 * Define (ou troca) a senha de um usuário, salvando apenas o hash.
 */
export async function setUserPassword(userId: string, newPassword: string): Promise<void> {
  requireSupabase()
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  }

  const passwordHash = await hashPassword(newPassword)
  const { error } = await supabase
    .from('user_passwords')
    .upsert({ user_id: userId, password_hash: passwordHash, updated_at: new Date().toISOString() })

  if (error) throw error
}

/**
 * Garante que existe um usuário admin padrão com senha cadastrada
 */
export async function ensureDefaultAdmin() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Não é possível criar usuário admin padrão.')
    return null
  }

  try {
    let { data: admin, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', DEFAULT_ADMIN_EMAIL)
      .maybeSingle()

    if (error) throw error

    if (!admin) {
      const created = await supabase
        .from('users')
        .insert({ name: DEFAULT_ADMIN_NAME, email: DEFAULT_ADMIN_EMAIL, role: 'admin' })
        .select('id')
        .single()
      if (created.error?.code === '23505') {
        // Outra aba (ou chamada simultânea) criou o admin ao mesmo tempo
        const existing = await supabase.from('users').select('id').eq('email', DEFAULT_ADMIN_EMAIL).single()
        if (existing.error) throw existing.error
        admin = existing.data
      } else if (created.error) {
        throw created.error
      } else {
        admin = created.data
      }
    }

    if (!(await getPasswordHash(admin.id))) {
      await setUserPassword(admin.id, DEFAULT_ADMIN_PASSWORD)
    }

    return admin
  } catch (error) {
    console.error('❌ Erro ao garantir usuário admin:', error)
    return null
  }
}

/**
 * Autentica um usuário usando email e senha.
 * Retorna null para credenciais inválidas ou usuário inativo.
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  requireSupabase()

  // No primeiro acesso, o admin padrão pode ainda não ter sido criado
  if (normalizeEmail(email) === DEFAULT_ADMIN_EMAIL) {
    await ensureDefaultAdmin()
  }

  const { data: row, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle()

  if (error) {
    console.error('❌ Erro ao buscar usuário:', error)
    throw new Error('Erro ao autenticar usuário')
  }

  if (!row) return null

  const storedHash = await getPasswordHash(row.id)
  if (!storedHash || !(await verifyPassword(password, storedHash))) {
    return null
  }

  const user = mapUser(row)
  if (!user.isActive) {
    throw new Error('Este usuário está inativo. Fale com o administrador.')
  }

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id)

  return user
}

/**
 * Troca a senha do próprio usuário, conferindo a senha atual.
 */
export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  requireSupabase()
  const storedHash = await getPasswordHash(userId)
  if (!storedHash || !(await verifyPassword(currentPassword, storedHash))) {
    throw new Error('A senha atual está incorreta.')
  }
  await setUserPassword(userId, newPassword)
}

/**
 * Busca um usuário pelo ID
 */
export async function getUserById(id: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? mapUser(data) : null
}

/**
 * Lista todos os usuários
 */
export async function getUsers(): Promise<User[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase.from('users').select('*').order('name')

  if (error) throw error
  return (data || []).map(mapUser)
}

/**
 * Cria um novo usuário com senha
 */
export async function createUser(
  user: Pick<User, 'name' | 'email' | 'role'> & { isActive?: boolean },
  password: string,
): Promise<User> {
  requireSupabase()

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: user.name.trim(),
      email: normalizeEmail(user.email),
      role: user.role,
      is_active: user.isActive ?? true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Já existe um usuário com este email.')
    throw error
  }

  try {
    await setUserPassword(data.id, password)
  } catch (passwordError) {
    // Sem senha o usuário não conseguiria entrar: desfaz o cadastro
    await supabase.from('users').delete().eq('id', data.id)
    throw passwordError
  }

  return mapUser(data)
}

/**
 * Atualiza um usuário
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  requireSupabase()

  const updateData: Record<string, unknown> = {}
  if (updates.name !== undefined) updateData.name = updates.name.trim()
  if (updates.email !== undefined) updateData.email = normalizeEmail(updates.email)
  if (updates.role !== undefined) updateData.role = updates.role
  if (updates.avatar !== undefined) updateData.avatar = updates.avatar || null
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive

  const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single()

  if (error) {
    if (error.code === '23505') throw new Error('Já existe um usuário com este email.')
    throw error
  }
  return mapUser(data)
}

/**
 * Remove um usuário
 */
export async function deleteUser(id: string): Promise<void> {
  requireSupabase()

  const { error } = await supabase.from('users').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('Este usuário tem movimentações registradas e não pode ser removido. Marque-o como inativo.')
    }
    throw error
  }
}

// ============================================
// Recuperação de senha
// ============================================

/**
 * Registra um pedido de recuperação de senha.
 * Não informa se o email existe, para não expor quem tem cadastro.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  requireSupabase()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('email', normalizeEmail(email))
    .maybeSingle()

  if (error) throw error
  if (!user || user.is_active === false) return

  const { data: pending, error: pendingError } = await supabase
    .from('password_reset_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pendente')
    .limit(1)

  if (pendingError) throw pendingError
  if (pending && pending.length > 0) return

  const { error: insertError } = await supabase.from('password_reset_requests').insert({ user_id: user.id })
  if (insertError) throw insertError
}

/**
 * Lista os pedidos de recuperação de senha pendentes
 */
export async function getPendingPasswordResets(): Promise<PasswordResetRequest[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  const users = await getUsers()
  const byId = new Map(users.map((u) => [u.id, u]))

  return data.map((request) => {
    const user = byId.get(request.user_id)
    return {
      id: request.id,
      userId: request.user_id,
      userName: user?.name ?? 'Usuário removido',
      userEmail: user?.email ?? '-',
      status: request.status,
      createdAt: parseDate(request.created_at)!,
      resolvedAt: parseDate(request.resolved_at) || undefined,
    }
  })
}

/**
 * Conclui um pedido definindo uma senha provisória para o usuário
 */
export async function resolvePasswordReset(request: PasswordResetRequest, temporaryPassword: string) {
  await setUserPassword(request.userId, temporaryPassword)
  await closePasswordReset(request.id, 'concluido')
}

/**
 * Fecha um pedido sem trocar a senha
 */
export async function closePasswordReset(requestId: string, status: 'concluido' | 'recusado' = 'recusado') {
  requireSupabase()
  const { error } = await supabase
    .from('password_reset_requests')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) throw error
}
