import type { UserRole } from "@/lib/types"

/**
 * Regras de acesso do sistema.
 * Cada módulo define quem pode ver (view) e quem pode criar/editar/remover (manage).
 */

export type Module =
  | "dashboard"
  | "membros"
  | "eventos"
  | "agenda"
  | "dizimos"
  | "cultos"
  | "caixa"
  | "contas-a-pagar"
  | "relatorio"
  | "configuracoes"
  | "perfil"

export type Action = "view" | "manage"

export const ALL_ROLES: UserRole[] = ["admin", "pastor", "secretaria", "tesouraria", "auditor", "membro"]

const LEADERSHIP: UserRole[] = ["admin", "pastor", "secretaria"]
const FINANCE: UserRole[] = ["admin", "pastor", "tesouraria", "auditor"]

export const permissions: Record<Module, Record<Action, UserRole[]>> = {
  // Dashboard e Relatório são só de consulta
  dashboard: { view: ALL_ROLES, manage: [] },
  membros: { view: LEADERSHIP, manage: LEADERSHIP },
  eventos: { view: ALL_ROLES, manage: LEADERSHIP },
  agenda: { view: ALL_ROLES, manage: LEADERSHIP },
  // Dízimos e ofertas: acesso exclusivo de pastores e administradores
  dizimos: { view: ["admin", "pastor"], manage: ["admin", "pastor"] },
  cultos: { view: [...FINANCE, "secretaria"], manage: ["admin", "pastor", "tesouraria", "secretaria"] },
  caixa: { view: FINANCE, manage: ["admin", "pastor", "tesouraria"] },
  "contas-a-pagar": { view: FINANCE, manage: ["admin", "tesouraria"] },
  relatorio: { view: ALL_ROLES, manage: [] },
  configuracoes: { view: ["admin"], manage: ["admin"] },
  perfil: { view: ALL_ROLES, manage: ALL_ROLES },
}

export const moduleLabels: Record<Module, string> = {
  dashboard: "Dashboard",
  membros: "Membros",
  eventos: "Eventos",
  agenda: "Agenda",
  dizimos: "Dízimos e Ofertas",
  cultos: "Cultos",
  caixa: "Caixa",
  "contas-a-pagar": "Despesas",
  relatorio: "Relatório",
  configuracoes: "Configurações",
  perfil: "Meu Perfil",
}

export function can(role: UserRole | undefined | null, module: Module, action: Action = "view"): boolean {
  if (!role) return false
  return permissions[module][action].includes(role)
}

/** Descobre o módulo de uma rota, ex.: "/membros/123/editar" → "membros" */
export function moduleFromPath(pathname: string): Module | null {
  const first = pathname.split("/").filter(Boolean)[0]
  if (!first) return "dashboard"
  return first in permissions ? (first as Module) : null
}

/** Segmentos de rota que alteram dados e exigem permissão de gerenciar */
const MANAGE_SEGMENTS = new Set([
  "novo",
  "nova",
  "editar",
  "importar",
  "configurar",
  "fechamento",
  "nova-movimentacao",
  "transferencias",
  "categorias",
  "fornecedores",
])

export function canAccessPath(role: UserRole | undefined | null, pathname: string): boolean {
  const module = moduleFromPath(pathname)
  // Rotas fora do mapa (ex.: páginas públicas) não são bloqueadas aqui
  if (!module) return true
  const needsManage = pathname.split("/").some((segment) => MANAGE_SEGMENTS.has(segment))
  return can(role, module, needsManage ? "manage" : "view")
}
