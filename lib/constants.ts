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
  tesouraria: "Tesouraria",
  secretaria: "Secretaria",
  pastor: "Pastor/Líder",
  auditor: "Auditor/Conselho",
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
