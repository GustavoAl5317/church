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
