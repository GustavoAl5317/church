import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if environment variables are configured
const isConfigured = supabaseUrl && supabaseAnonKey && 
                    supabaseUrl !== 'https://your-project.supabase.co' &&
                    supabaseUrl !== 'https://placeholder.supabase.co' &&
                    supabaseAnonKey !== 'your-anon-key-here' &&
                    supabaseAnonKey !== 'placeholder-key' &&
                    supabaseUrl.startsWith('https://') &&
                    supabaseAnonKey.length > 20

if (!isConfigured) {
  if (typeof window === 'undefined') {
    // Server-side: log error
    console.error(
      '\n❌ ERRO: Variáveis de ambiente do Supabase não configuradas!\n' +
      'Por favor, configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env\n' +
      'Veja SETUP.md para instruções detalhadas.\n' +
      'Copie o arquivo env.example.txt para .env e preencha com suas credenciais.\n'
    )
  }
}

// Create Supabase client
// Always create a client, but it will fail on queries if not configured
// This prevents the app from crashing during initialization
export const supabase = createClient<Database>(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder',
  {
    auth: {
      persistSession: false,
    },
  }
)

// Export a helper to check if Supabase is configured
export const isSupabaseConfigured = isConfigured

// Helper function to convert database dates to Date objects
// Usar timezone local para evitar problemas de conversão
export function parseDate(dateString: string | null): Date | undefined {
  if (!dateString) return undefined
  // Se a data está no formato YYYY-MM-DD, criar no timezone local
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0, 0) // Meio do dia para evitar problemas
  }
  // Para outros formatos, usar o construtor padrão
  return new Date(dateString)
}

/**
 * Traduz um erro do Supabase em uma mensagem que diz o que fazer.
 */
export function describeSupabaseError(error: unknown): string {
  const e = (error ?? {}) as { code?: string; message?: string; hint?: string; details?: string }
  const message = e.message ?? String(error)
  const lower = message.toLowerCase()

  if (e.code === 'PGRST205' || e.code === '42P01' || lower.includes('does not exist') || lower.includes('could not find the table')) {
    return `O banco ainda não tem as tabelas do sistema. Rode supabase/schema.sql e depois supabase/migration-igreja-manager.sql no SQL Editor do Supabase. (${message})`
  }
  if (e.code === '42703' || lower.includes('column')) {
    return `O banco está desatualizado. Rode supabase/migration-igreja-manager.sql no SQL Editor do Supabase. (${message})`
  }
  if (lower.includes('invalid api key') || lower.includes('jwt') || e.code === 'PGRST301') {
    return 'A chave do Supabase é inválida. Confira NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel e faça um novo deploy.'
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('fetch failed')) {
    return 'Não foi possível conectar ao Supabase. Confira NEXT_PUBLIC_SUPABASE_URL na Vercel e se o projeto do Supabase está ativo (projetos gratuitos pausam após dias sem uso).'
  }
  if (e.code === '42501' || lower.includes('permission denied') || lower.includes('row-level security')) {
    return `O Supabase bloqueou o acesso à tabela (permissões/RLS). (${message})`
  }
  return message
}
