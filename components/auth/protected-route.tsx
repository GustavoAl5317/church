"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { canAccessPath } from "@/lib/permissions"

/**
 * Bloqueia a página para quem não fez login ou não tem permissão para a rota atual.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  const allowed = !!user && canAccessPath(user.role, pathname)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    if (!allowed) {
      toast.error("Você não tem permissão para acessar esta página.")
      router.replace("/dashboard")
    }
  }, [isLoading, user, allowed, pathname, router])

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
