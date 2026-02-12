import type {
  User,
  Member,
  Service,
  ServiceIncome,
  Event,
  CashBox,
  CashTransaction,
  Supplier,
  BillPayable,
  AuditLog,
  Notification,
  DashboardSummary,
  ChartData,
  IncomeByTypeData,
} from "./types"

// Current user
export const currentUser: User = {
  id: "1",
  name: "João Silva",
  email: "admin@livresouemcristo.com.br",
  role: "admin",
  avatar: "/diverse-avatars.png",
  createdAt: new Date("2024-01-01"),
  lastLogin: new Date(),
}

// Users
export const users: User[] = [
  currentUser,
  {
    id: "2",
    name: "Maria Santos",
    email: "tesouraria@livresouemcristo.com.br",
    role: "tesouraria",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "secretaria@livresouemcristo.com.br",
    role: "secretaria",
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "4",
    name: "Pastor Carlos",
    email: "pastor@livresouemcristo.com.br",
    role: "pastor",
    createdAt: new Date("2024-01-01"),
  },
]

// Members
export const members: Member[] = [
  {
    id: "1",
    name: "Ana Paula Ferreira",
    birthDate: new Date("1985-03-15"),
    phone: "(11) 99999-1111",
    email: "ana@email.com",
    address: "Rua das Flores, 123",
    entryDate: new Date("2020-01-15"),
    status: "ativo",
    ministries: ["Louvor", "Intercessão"],
    createdAt: new Date("2020-01-15"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "2",
    name: "Roberto Almeida",
    birthDate: new Date("1978-07-22"),
    phone: "(11) 99999-2222",
    email: "roberto@email.com",
    entryDate: new Date("2019-06-10"),
    status: "ativo",
    ministries: ["Diaconia"],
    createdAt: new Date("2019-06-10"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "3",
    name: "Juliana Costa",
    birthDate: new Date("1990-11-08"),
    phone: "(11) 99999-3333",
    entryDate: new Date("2022-03-20"),
    status: "ativo",
    ministries: ["Infantil", "Escola Bíblica"],
    createdAt: new Date("2022-03-20"),
    updatedAt: new Date("2024-04-10"),
  },
  {
    id: "4",
    name: "Marcos Silva",
    phone: "(11) 99999-4444",
    entryDate: new Date("2024-01-07"),
    status: "visitante",
    ministries: [],
    createdAt: new Date("2024-01-07"),
    updatedAt: new Date("2024-01-07"),
  },
  {
    id: "5",
    name: "Fernanda Lima",
    birthDate: new Date("1982-05-30"),
    phone: "(11) 99999-5555",
    email: "fernanda@email.com",
    entryDate: new Date("2018-09-15"),
    status: "inativo",
    ministries: ["Louvor"],
    observations: "Mudou de cidade em 2024",
    createdAt: new Date("2018-09-15"),
    updatedAt: new Date("2024-02-01"),
  },
]

// Services (Cultos)
export const services: Service[] = [
  {
    id: "1",
    name: "Culto da Família",
    type: "culto_familia",
    date: new Date("2025-01-12"),
    time: "19:00",
    status: "finalizado",
    totalIncome: 4580.0,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-12"),
  },
  {
    id: "2",
    name: "Celebração Dominical",
    type: "celebracao",
    date: new Date("2025-01-12"),
    time: "10:00",
    status: "finalizado",
    totalIncome: 6250.0,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-12"),
  },
  {
    id: "3",
    name: "Culto de Oração",
    type: "oracao",
    date: new Date("2025-01-15"),
    time: "19:30",
    status: "finalizado",
    totalIncome: 1250.0,
    createdAt: new Date("2025-01-13"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "4",
    name: "Culto da Família",
    type: "culto_familia",
    date: new Date("2025-01-19"),
    time: "19:00",
    status: "agendado",
    createdAt: new Date("2025-01-16"),
    updatedAt: new Date("2025-01-16"),
  },
]

// Service Incomes
export const serviceIncomes: ServiceIncome[] = [
  {
    id: "1",
    serviceId: "1",
    type: "dizimo",
    amount: 2500.0,
    paymentMethod: "dinheiro",
    createdAt: new Date("2025-01-12"),
  },
  {
    id: "2",
    serviceId: "1",
    type: "oferta",
    amount: 1580.0,
    paymentMethod: "pix",
    createdAt: new Date("2025-01-12"),
  },
  {
    id: "3",
    serviceId: "1",
    type: "campanha",
    amount: 500.0,
    paymentMethod: "dinheiro",
    observations: "Campanha Missões",
    createdAt: new Date("2025-01-12"),
  },
  {
    id: "4",
    serviceId: "2",
    type: "dizimo",
    amount: 3800.0,
    paymentMethod: "dinheiro",
    createdAt: new Date("2025-01-12"),
  },
  {
    id: "5",
    serviceId: "2",
    type: "oferta",
    amount: 2450.0,
    paymentMethod: "pix",
    createdAt: new Date("2025-01-12"),
  },
]

// Events
export const events: Event[] = [
  {
    id: "1",
    name: "Conferência de Jovens 2025",
    description: "Conferência anual para jovens da igreja",
    startDate: new Date("2025-02-15"),
    endDate: new Date("2025-02-17"),
    status: "planejado",
    totalIncome: 0,
    totalExpense: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-10"),
  },
  {
    id: "2",
    name: "Campanha do Agasalho",
    description: "Arrecadação de roupas e doações para famílias carentes",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-31"),
    status: "em_andamento",
    totalIncome: 3500.0,
    totalExpense: 1200.0,
    createdAt: new Date("2024-12-15"),
    updatedAt: new Date("2025-01-15"),
  },
]

// Cash Boxes
export const cashBoxes: CashBox[] = [
  {
    id: "1",
    name: "Caixa Geral",
    type: "geral",
    balance: 45680.5,
    initialBalance: 10000.0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2025-01-16"),
  },
  {
    id: "2",
    name: "Caixa - Campanha do Agasalho",
    type: "evento",
    eventId: "2",
    balance: 2300.0,
    initialBalance: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
  },
]

// Cash Transactions
export const cashTransactions: CashTransaction[] = [
  {
    id: "1",
    cashBoxId: "1",
    type: "entrada",
    category: "Culto",
    description: "Entradas do Culto da Família - 12/01",
    amount: 4580.0,
    paymentMethod: "dinheiro",
    date: new Date("2025-01-12"),
    relatedServiceId: "1",
    responsibleId: "2",
    responsibleName: "Maria Santos",
    createdAt: new Date("2025-01-12"),
  },
  {
    id: "2",
    cashBoxId: "1",
    type: "entrada",
    category: "Culto",
    description: "Entradas da Celebração Dominical - 12/01",
    amount: 6250.0,
    paymentMethod: "pix",
    date: new Date("2025-01-12"),
    relatedServiceId: "2",
    responsibleId: "2",
    responsibleName: "Maria Santos",
    createdAt: new Date("2025-01-12"),
  },
  {
    id: "3",
    cashBoxId: "1",
    type: "saida",
    category: "Aluguel",
    description: "Aluguel do templo - Janeiro/2025",
    amount: 3500.0,
    paymentMethod: "transferencia",
    date: new Date("2025-01-05"),
    relatedBillId: "1",
    responsibleId: "2",
    responsibleName: "Maria Santos",
    createdAt: new Date("2025-01-05"),
  },
  {
    id: "4",
    cashBoxId: "1",
    type: "saida",
    category: "Luz",
    description: "Conta de luz - Dezembro/2024",
    amount: 450.0,
    paymentMethod: "pix",
    date: new Date("2025-01-10"),
    relatedBillId: "2",
    responsibleId: "2",
    responsibleName: "Maria Santos",
    createdAt: new Date("2025-01-10"),
  },
  {
    id: "5",
    cashBoxId: "2",
    type: "entrada",
    category: "Doação",
    description: "Doação para campanha do agasalho",
    amount: 500.0,
    paymentMethod: "dinheiro",
    date: new Date("2025-01-14"),
    responsibleId: "3",
    responsibleName: "Pedro Oliveira",
    createdAt: new Date("2025-01-14"),
  },
]

// Suppliers
export const suppliers: Supplier[] = [
  {
    id: "1",
    name: "Imobiliária Central",
    contact: "Carlos",
    phone: "(11) 3333-1111",
    email: "contato@imobiliariacentral.com.br",
    category: "Imóveis",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Eletropaulo",
    phone: "0800-123-4567",
    category: "Serviços Públicos",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "3",
    name: "Sabesp",
    phone: "0800-123-7890",
    category: "Serviços Públicos",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "4",
    name: "Tech Som",
    contact: "Fernando",
    phone: "(11) 99999-6666",
    category: "Equipamentos",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
  },
]

// Bills Payable
export const billsPayable: BillPayable[] = [
  {
    id: "1",
    supplierId: "1",
    supplierName: "Imobiliária Central",
    description: "Aluguel do templo - Fevereiro/2025",
    amount: 3500.0,
    dueDate: new Date("2025-02-05"),
    recurrence: "mensal",
    category: "aluguel",
    costCenter: "geral",
    status: "pendente",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "2",
    supplierId: "2",
    supplierName: "Eletropaulo",
    description: "Conta de luz - Janeiro/2025",
    amount: 520.0,
    dueDate: new Date("2025-01-20"),
    recurrence: "mensal",
    category: "luz",
    costCenter: "geral",
    status: "pendente",
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-05"),
  },
  {
    id: "3",
    supplierId: "3",
    supplierName: "Sabesp",
    description: "Conta de água - Janeiro/2025",
    amount: 180.0,
    dueDate: new Date("2025-01-18"),
    recurrence: "mensal",
    category: "agua",
    costCenter: "geral",
    status: "pendente",
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-05"),
  },
  {
    id: "4",
    supplierName: "Internet Provider",
    description: "Internet - Janeiro/2025",
    amount: 250.0,
    dueDate: new Date("2025-01-15"),
    recurrence: "mensal",
    category: "internet",
    costCenter: "geral",
    status: "atrasado",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-16"),
  },
  {
    id: "5",
    supplierId: "4",
    supplierName: "Tech Som",
    description: "Manutenção do sistema de som",
    amount: 800.0,
    dueDate: new Date("2025-01-25"),
    recurrence: "unica",
    category: "manutencao",
    costCenter: "geral",
    status: "pendente",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
  },
]

// Audit Logs
export const auditLogs: AuditLog[] = [
  {
    id: "1",
    action: "criar",
    entity: "Service",
    entityId: "4",
    after: { name: "Culto da Família", date: "2025-01-19" },
    userId: "1",
    userName: "João Silva",
    timestamp: new Date("2025-01-16T10:30:00"),
  },
  {
    id: "2",
    action: "editar",
    entity: "BillPayable",
    entityId: "4",
    before: { status: "pendente" },
    after: { status: "atrasado" },
    userId: "system",
    userName: "Sistema",
    timestamp: new Date("2025-01-16T00:00:00"),
  },
  {
    id: "3",
    action: "criar",
    entity: "CashTransaction",
    entityId: "1",
    after: { description: "Entradas do Culto da Família", amount: 4580 },
    userId: "2",
    userName: "Maria Santos",
    timestamp: new Date("2025-01-12T21:30:00"),
  },
  {
    id: "4",
    action: "login",
    entity: "User",
    entityId: "1",
    userId: "1",
    userName: "João Silva",
    timestamp: new Date("2025-01-16T08:00:00"),
    ip: "192.168.1.100",
  },
]

// Notifications
export const notifications: Notification[] = [
  {
    id: "1",
    type: "alerta",
    title: "Conta atrasada",
    message: "A conta de Internet está atrasada desde 15/01/2025",
    read: false,
    createdAt: new Date("2025-01-16T00:00:00"),
  },
  {
    id: "2",
    type: "alerta",
    title: "Contas vencendo",
    message: "2 contas vencem nos próximos 7 dias",
    read: false,
    createdAt: new Date("2025-01-16T00:00:00"),
  },
  {
    id: "3",
    type: "info",
    title: "Culto agendado",
    message: "Culto da Família agendado para 19/01/2025 às 19:00",
    read: true,
    createdAt: new Date("2025-01-16T10:30:00"),
  },
]

// Dashboard Summary
export const dashboardSummary: DashboardSummary = {
  generalBalance: 45680.5,
  monthBalance: 6130.0,
  monthIncome: 12080.0,
  monthExpense: 5950.0,
  upcomingBills: 4,
  overdueBills: 1,
}

// Chart data - Income vs Expenses by month
export const monthlyChartData: ChartData[] = [
  { month: "Ago", entradas: 28500, gastos: 15200 },
  { month: "Set", entradas: 31200, gastos: 14800 },
  { month: "Out", entradas: 29800, gastos: 16500 },
  { month: "Nov", entradas: 35600, gastos: 18200 },
  { month: "Dez", entradas: 42300, gastos: 22100 },
  { month: "Jan", entradas: 12080, gastos: 5950 },
]

// Income by type data
export const incomeByTypeData: IncomeByTypeData[] = [
  { type: "Dízimo", value: 6300, fill: "var(--chart-1)" },
  { type: "Oferta", value: 4030, fill: "var(--chart-2)" },
  { type: "Doação", value: 1250, fill: "var(--chart-3)" },
  { type: "Campanha", value: 500, fill: "var(--chart-4)" },
]

// Categories for bills
export const billCategories = [
  { value: "aluguel", label: "Aluguel" },
  { value: "agua", label: "Água" },
  { value: "luz", label: "Luz" },
  { value: "internet", label: "Internet" },
  { value: "som", label: "Som/Equipamentos" },
  { value: "manutencao", label: "Manutenção" },
  { value: "acao_social", label: "Ação Social" },
  { value: "salarios", label: "Salários" },
  { value: "outros", label: "Outros" },
]

// Ministries
export const ministries = [
  "Louvor",
  "Intercessão",
  "Diaconia",
  "Infantil",
  "Escola Bíblica",
  "Jovens",
  "Mulheres",
  "Homens",
  "Casais",
  "Mídia",
  "Recepção",
]

// Service types
export const serviceTypes = [
  { value: "culto_familia", label: "Culto da Família" },
  { value: "celebracao", label: "Celebração" },
  { value: "oracao", label: "Culto de Oração" },
  { value: "jovens", label: "Culto de Jovens" },
  { value: "mulheres", label: "Culto de Mulheres" },
  { value: "homens", label: "Culto de Homens" },
  { value: "especial", label: "Culto Especial" },
]

// Income types
export const incomeTypes = [
  { value: "dizimo", label: "Dízimo" },
  { value: "oferta", label: "Oferta" },
  { value: "doacao", label: "Doação" },
  { value: "campanha", label: "Campanha" },
  { value: "outros", label: "Outros" },
]

// Payment methods
export const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "outros", label: "Outros" },
]

// Role labels
export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  tesouraria: "Tesouraria",
  secretaria: "Secretaria",
  pastor: "Pastor/Líder",
  auditor: "Auditor/Conselho",
}
