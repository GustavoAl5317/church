export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'tesouraria' | 'secretaria' | 'pastor' | 'auditor'
          avatar: string | null
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'admin' | 'tesouraria' | 'secretaria' | 'pastor' | 'auditor'
          avatar?: string | null
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'tesouraria' | 'secretaria' | 'pastor' | 'auditor'
          avatar?: string | null
          created_at?: string
          last_login?: string | null
        }
      }
      members: {
        Row: {
          id: string
          name: string
          birth_date: string | null
          phone: string | null
          email: string | null
          address: string | null
          entry_date: string
          status: 'ativo' | 'inativo' | 'visitante'
          ministries: string[]
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          birth_date?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          entry_date: string
          status: 'ativo' | 'inativo' | 'visitante'
          ministries?: string[]
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          birth_date?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          entry_date?: string
          status?: 'ativo' | 'inativo' | 'visitante'
          ministries?: string[]
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_templates: {
        Row: {
          id: string
          name: string
          type: 'culto_familia' | 'celebracao' | 'oracao' | 'jovens' | 'mulheres' | 'homens' | 'especial'
          time: string
          day_of_week: number | null // 0 = Sunday, 1 = Monday, etc.
          is_recurring: boolean
          is_active: boolean
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'culto_familia' | 'celebracao' | 'oracao' | 'jovens' | 'mulheres' | 'homens' | 'especial'
          time: string
          day_of_week?: number | null
          is_recurring?: boolean
          is_active?: boolean
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'culto_familia' | 'celebracao' | 'oracao' | 'jovens' | 'mulheres' | 'homens' | 'especial'
          time?: string
          day_of_week?: number | null
          is_recurring?: boolean
          is_active?: boolean
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          template_id: string | null
          name: string
          type: 'culto_familia' | 'celebracao' | 'oracao' | 'jovens' | 'mulheres' | 'homens' | 'especial'
          date: string
          time: string
          status: 'agendado' | 'em_andamento' | 'finalizado'
          observations: string | null
          total_income: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          name: string
          type: 'culto_familia' | 'celebracao' | 'oracao' | 'jovens' | 'mulheres' | 'homens' | 'especial'
          date: string
          time: string
          status?: 'agendado' | 'em_andamento' | 'finalizado'
          observations?: string | null
          total_income?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          name?: string
          type?: 'culto_familia' | 'celebracao' | 'oracao' | 'jovens' | 'mulheres' | 'homens' | 'especial'
          date?: string
          time?: string
          status?: 'agendado' | 'em_andamento' | 'finalizado'
          observations?: string | null
          total_income?: number
          created_at?: string
          updated_at?: string
        }
      }
      service_incomes: {
        Row: {
          id: string
          service_id: string
          type: 'dizimo' | 'oferta' | 'doacao' | 'campanha' | 'outros'
          amount: number
          payment_method: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros'
          observations: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          type: 'dizimo' | 'oferta' | 'doacao' | 'campanha' | 'outros'
          amount: number
          payment_method: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros'
          observations?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          type?: 'dizimo' | 'oferta' | 'doacao' | 'campanha' | 'outros'
          amount?: number
          payment_method?: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros'
          observations?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string | null
          status: 'planejado' | 'em_andamento' | 'finalizado' | 'cancelado'
          cash_box_id: string | null
          total_income: number
          total_expense: number
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          status?: 'planejado' | 'em_andamento' | 'finalizado' | 'cancelado'
          cash_box_id?: string | null
          total_income?: number
          total_expense?: number
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          status?: 'planejado' | 'em_andamento' | 'finalizado' | 'cancelado'
          cash_box_id?: string | null
          total_income?: number
          total_expense?: number
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cash_boxes: {
        Row: {
          id: string
          name: string
          type: 'geral' | 'evento'
          event_id: string | null
          balance: number
          initial_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'geral' | 'evento'
          event_id?: string | null
          balance?: number
          initial_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'geral' | 'evento'
          event_id?: string | null
          balance?: number
          initial_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      cash_transactions: {
        Row: {
          id: string
          cash_box_id: string
          type: 'entrada' | 'saida' | 'transferencia'
          category: string
          description: string
          amount: number
          payment_method: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros'
          date: string
          related_service_id: string | null
          related_bill_id: string | null
          related_transfer_id: string | null
          responsible_id: string
          responsible_name: string
          observations: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cash_box_id: string
          type: 'entrada' | 'saida' | 'transferencia'
          category: string
          description: string
          amount: number
          payment_method: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros'
          date: string
          related_service_id?: string | null
          related_bill_id?: string | null
          related_transfer_id?: string | null
          responsible_id: string
          responsible_name: string
          observations?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cash_box_id?: string
          type?: 'entrada' | 'saida' | 'transferencia'
          category?: string
          description?: string
          amount?: number
          payment_method?: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros'
          date?: string
          related_service_id?: string | null
          related_bill_id?: string | null
          related_transfer_id?: string | null
          responsible_id?: string
          responsible_name?: string
          observations?: string | null
          created_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact: string | null
          phone: string | null
          email: string | null
          category: string
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact?: string | null
          phone?: string | null
          email?: string | null
          category: string
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact?: string | null
          phone?: string | null
          email?: string | null
          category?: string
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bills_payable: {
        Row: {
          id: string
          supplier_id: string | null
          supplier_name: string | null
          description: string
          amount: number
          due_date: string
          paid_date: string | null
          recurrence: 'mensal' | 'semanal' | 'anual' | 'unica' | null
          category: 'aluguel' | 'agua' | 'luz' | 'internet' | 'som' | 'manutencao' | 'acao_social' | 'salarios' | 'outros'
          cost_center: 'geral' | 'evento'
          event_id: string | null
          payment_method: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros' | null
          status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id?: string | null
          supplier_name?: string | null
          description: string
          amount: number
          due_date: string
          paid_date?: string | null
          recurrence?: 'mensal' | 'semanal' | 'anual' | 'unica' | null
          category: 'aluguel' | 'agua' | 'luz' | 'internet' | 'som' | 'manutencao' | 'acao_social' | 'salarios' | 'outros'
          cost_center?: 'geral' | 'evento'
          event_id?: string | null
          payment_method?: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros' | null
          status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string | null
          supplier_name?: string | null
          description?: string
          amount?: number
          due_date?: string
          paid_date?: string | null
          recurrence?: 'mensal' | 'semanal' | 'anual' | 'unica' | null
          category?: 'aluguel' | 'agua' | 'luz' | 'internet' | 'som' | 'manutencao' | 'acao_social' | 'salarios' | 'outros'
          cost_center?: 'geral' | 'evento'
          event_id?: string | null
          payment_method?: 'dinheiro' | 'pix' | 'cartao' | 'transferencia' | 'outros' | null
          status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
