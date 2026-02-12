import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/recuperar-senha', '/api/auth']

// Rotas que redirecionam para login se não autenticado
const protectedRoutes = ['/dashboard', '/cultos', '/caixa', '/contas-a-pagar', '/eventos', '/membros', '/usuarios', '/relatorios', '/auditoria', '/configuracoes', '/perfil']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permite rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verifica se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Verifica se há token de sessão no cookie ou header
    // Como estamos usando localStorage no cliente, vamos verificar no cliente
    // O proxy apenas redireciona se for uma rota protegida
    // A verificação real de autenticação será feita no componente
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
