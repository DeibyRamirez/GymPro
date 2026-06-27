"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientsView } from "@/components/trainer/clients-view"
import { TrainerInbox } from "@/components/trainer/trainer-inbox"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import { MessageSquare, Users } from "lucide-react"

interface TrainerClientsSectionProps {
  trainerId: string
  onBack: () => void
}

export function TrainerClientsSection({ trainerId, onBack }: TrainerClientsSectionProps) {
  return (
    <DashboardSectionShell
      title="Mis clientes"
      description="Gestiona tu cartera, revisa mensajes y da seguimiento a cada persona."
      onBack={onBack}
    >
      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Bandeja de mensajes
          </CardTitle>
          <CardDescription>Conversaciones pendientes con tus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <TrainerInbox trainerId={trainerId} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cartera de clientes
          </CardTitle>
          <CardDescription>Listado completo con acciones de asignación y seguimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsView trainerId={trainerId} />
        </CardContent>
      </Card>
    </DashboardSectionShell>
  )
}
