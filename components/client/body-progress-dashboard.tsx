"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { BodyProgressPanel } from "./body-progress-panel"

interface BodyProgressDashboardProps {
  onBack: () => void
  userId: string
}

export function BodyProgressDashboard({ onBack, userId }: BodyProgressDashboardProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-balance">Registro Corporal</h2>
        <p className="text-muted-foreground mt-2">Consulta tu evolución, logros y registra nuevas mediciones.</p>
      </div>

      <BodyProgressPanel userId={userId} />
    </div>
  )
}
