import type React from "react"
import { Church } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function AuthScreen({ children, subtitle }: { children: React.ReactNode; subtitle: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-800 shadow-lg">
            <Church className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Igreja Manager</h1>
          <p className="mt-1 text-blue-100">{subtitle}</p>
        </div>
        <Card className="shadow-xl">
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}
