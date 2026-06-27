"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"

interface DashboardSectionShellProps {
  title: string
  description: string
  onBack: () => void
  children: ReactNode
}

export function DashboardSectionShell({
  title,
  description,
  onBack,
  children,
}: DashboardSectionShellProps) {
  return (
    <div className="w-full space-y-6 xl:px-2 2xl:px-4">
      <Button variant="ghost" onClick={onBack} className="w-fit gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Button>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      {children}
    </div>
  )
}
