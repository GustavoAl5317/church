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

// Day of week options
export const dayOfWeekOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

// Role labels
export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  pastor: "Pastor",
  secretaria: "Secretaria",
  tesouraria: "Tesouraria",
  auditor: "Auditor/Conselho",
  membro: "Membro",
}

export const roleDescriptions: Record<string, string> = {
  admin: "Gestão completa do sistema, de usuários e de permissões",
  pastor: "Visão geral da igreja, membros, eventos e controle financeiro",
  secretaria: "Cadastros, agenda e organização do dia a dia",
  tesouraria: "Caixa, cultos e contas a pagar",
  auditor: "Consulta das informações financeiras",
  membro: "Consulta de eventos e da agenda da igreja",
}

// Member status and role
export const memberStatusLabels: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  visitante: "Visitante",
}

export const memberStatusBadgeClass: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  inativo: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  visitante: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
}

export const memberRoleLabels: Record<string, string> = {
  membro: "Membro",
  lider: "Líder",
  voluntario: "Voluntário",
}

// Event types and status
export const eventTypeLabels: Record<string, string> = {
  culto: "Culto",
  reuniao: "Reunião",
  retiro: "Retiro",
  conferencia: "Conferência",
  outro: "Outro",
}

export const eventStatusLabels: Record<string, string> = {
  planejado: "Agendado",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
}

// Tithes
export const titheTypeLabels: Record<string, string> = {
  dizimo: "Dízimo",
  oferta: "Oferta",
}

export const titheStatusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  pendente: "Pendente",
}

// Bill categories
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
