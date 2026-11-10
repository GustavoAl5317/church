"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Church,
  Wallet,
  Receipt,
  Users,
  FileText,
  CalendarDays,
  BookOpen,
  HandCoins,
  Settings,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { roleLabels } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import type { Module } from "@/lib/permissions"

interface MenuItem {
  title: string
  url: string
  icon: LucideIcon
  module: Module
}

const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: "Comunidade",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
      { title: "Membros", url: "/membros", icon: Users, module: "membros" },
      { title: "Eventos", url: "/eventos", icon: CalendarDays, module: "eventos" },
      { title: "Agenda", url: "/agenda", icon: BookOpen, module: "agenda" },
      { title: "Dízimos", url: "/dizimos", icon: HandCoins, module: "dizimos" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Cultos", url: "/cultos", icon: Church, module: "cultos" },
      { title: "Caixa", url: "/caixa", icon: Wallet, module: "caixa" },
      { title: "Despesas", url: "/contas-a-pagar", icon: Receipt, module: "contas-a-pagar" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Relatório", url: "/relatorio", icon: FileText, module: "relatorio" },
      { title: "Configurações", url: "/configuracoes", icon: Settings, module: "configuracoes" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, can } = useAuth()

  const isActive = (url: string) => pathname === url || pathname.startsWith(`${url}/`)

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <Church className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Igreja Manager</span>
            <span className="text-xs text-sidebar-foreground/70">Livre Sou em Cristo</span>
          </div>
        </div>
        {user && (
          <div className="px-2 pb-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60">Logado como</p>
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/70">{roleLabels[user.role]}</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => {
          const visible = group.items.filter((item) => can(item.module))
          if (visible.length === 0) return null
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link href={item.url}>
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/perfil")}>
              <Link href="/perfil">
                <UserRound className="h-5 w-5" />
                <span className="font-medium">Meu Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button variant="destructive" className="w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
