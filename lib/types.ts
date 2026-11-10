// Type definitions for the church management system

export type UserRole = "admin" | "tesouraria" | "secretaria" | "pastor" | "auditor" | "membro"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface PasswordResetRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: "pendente" | "concluido" | "recusado"
  createdAt: Date
  resolvedAt?: Date
}

export type MemberStatus = "ativo" | "inativo" | "visitante"
export type MemberRole = "membro" | "lider" | "voluntario"

export interface Member {
  id: string
  name: string
  birthDate?: Date
  phone?: string
  email?: string
  address?: string
  entryDate: Date
  status: MemberStatus
  memberRole: MemberRole
  baptized: boolean
  ministries: string[]
  observations?: string
  createdAt: Date
  updatedAt: Date
}

export type ServiceType = "culto_familia" | "celebracao" | "oracao" | "jovens" | "mulheres" | "homens" | "especial"

export interface ServiceTemplate {
  id: string
  name: string
  type: ServiceType
  time: string
  dayOfWeek?: number | null // 0 = Sunday, 1 = Monday, etc.
  isRecurring: boolean
  isActive: boolean
  observations?: string
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  templateId?: string | null
  name: string
  type: ServiceType
  date: Date
  time: string
  status: "agendado" | "em_andamento" | "finalizado"
  observations?: string
  incomes?: ServiceIncome[]
  totalIncome?: number
  createdAt: Date
  updatedAt: Date
}

export type IncomeType = "dizimo" | "oferta" | "doacao" | "campanha" | "outros"
export type PaymentMethod = "dinheiro" | "pix" | "cartao" | "transferencia" | "outros"

export interface ServiceIncome {
  id: string
  serviceId: string
  type: IncomeType
  amount: number
  paymentMethod: PaymentMethod
  observations?: string
  attachments?: Attachment[]
  createdAt: Date
}

export type EventType = "culto" | "reuniao" | "retiro" | "conferencia" | "outro"
export type EventStatus = "planejado" | "em_andamento" | "finalizado" | "cancelado"

export interface Event {
  id: string
  name: string
  description?: string
  type: EventType
  startDate: Date
  startTime?: string
  endDate?: Date
  location?: string
  capacity?: number
  attendance: number
  status: EventStatus
  cashBoxId?: string
  totalIncome: number
  totalExpense: number
  observations?: string
  createdAt: Date
  updatedAt: Date
}

export type TitheType = "dizimo" | "oferta"
export type TitheStatus = "confirmado" | "pendente"

export interface Tithe {
  id: string
  memberId?: string
  memberName: string
  type: TitheType
  amount: number
  date: Date
  paymentMethod: PaymentMethod
  status: TitheStatus
  observations?: string
  createdAt: Date
  updatedAt: Date
}

export interface CashBox {
  id: string
  name: string
  type: "geral" | "evento"
  eventId?: string
  balance: number
  initialBalance: number
  createdAt: Date
  updatedAt: Date
}

export type TransactionType = "entrada" | "saida" | "transferencia"

export interface CashTransaction {
  id: string
  cashBoxId: string
  type: TransactionType
  category: string
  description: string
  amount: number
  paymentMethod: PaymentMethod
  date: Date
  relatedServiceId?: string
  relatedBillId?: string
  relatedTransferId?: string
  responsibleId: string
  responsibleName: string
  observations?: string
  attachments?: Attachment[]
  createdAt: Date
}

export interface Supplier {
  id: string
  name: string
  contact?: string
  phone?: string
  email?: string
  category: string
  observations?: string
  createdAt: Date
  updatedAt: Date
}

export type BillStatus = "pendente" | "pago" | "atrasado" | "cancelado"
export type BillCategory = string // Agora é dinâmico, vem do banco de dados

export interface BillPayable {
  id: string
  supplierId?: string
  supplierName?: string
  description: string
  amount: number
  dueDate: Date
  paidDate?: Date
  recurrence?: "mensal" | "semanal" | "anual" | "unica"
  category: BillCategory
  costCenter: "geral" | "evento"
  eventId?: string
  paymentMethod?: PaymentMethod
  status: BillStatus
  observations?: string
  attachments?: Attachment[]
  createdAt: Date
  updatedAt: Date
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  createdAt: Date
}

export interface AuditLog {
  id: string
  action: "criar" | "editar" | "excluir" | "visualizar" | "exportar" | "login" | "logout"
  entity: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  userId: string
  userName: string
  timestamp: Date
  ip?: string
}

export interface Notification {
  id: string
  type: "alerta" | "info" | "sucesso" | "erro"
  title: string
  message: string
  read: boolean
  createdAt: Date
}

// Dashboard summary types
export interface DashboardSummary {
  generalBalance: number
  monthBalance: number
  monthIncome: number
  monthExpense: number
  upcomingBills: number
  overdueBills: number
}

export interface ChartData {
  month: string
  entradas: number
  gastos: number
}

export interface IncomeByTypeData {
  type: string
  value: number
  fill: string
}
