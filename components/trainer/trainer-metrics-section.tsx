"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientProgressCard } from "@/components/trainer/client-progress-card"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import { BarChart3, Dumbbell, Users, UtensilsCrossed, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

type ClientProgressItem = {
  clientId?: string
  clientName: string
  clientEmail: string
  progressCount: number
  latestMeasurement?: { weight?: number; bodyFat?: number; date?: string }
}

type TrainerStats = {
  myClients: number
  myRoutines: number
  myMealPlans: number
  myAssignments: number
}

interface TrainerMetricsSectionProps {
  stats: TrainerStats | null
  clientProgress: ClientProgressItem[]
  portalSlug: string
  onBack: () => void
}

function MetricTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className={`mb-2 flex items-center gap-2 text-xs text-muted-foreground ${accent}`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-3xl font-black">{value}</p>
    </div>
  )
}

export function TrainerMetricsSection({
  stats,
  clientProgress,
  portalSlug,
  onBack,
}: TrainerMetricsSectionProps) {
  const router = useRouter()

  return (
    <DashboardSectionShell
      title="Métricas y progreso"
      description="Indicadores de tu operación y seguimiento reciente de tus clientes."
      onBack={onBack}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={Users}
          label="Clientes activos"
          value={stats?.myClients ?? 0}
          accent="text-primary"
        />
        <MetricTile
          icon={Dumbbell}
          label="Rutinas creadas"
          value={stats?.myRoutines ?? 0}
          accent="text-accent"
        />
        <MetricTile
          icon={UtensilsCrossed}
          label="Planes alimenticios"
          value={stats?.myMealPlans ?? 0}
          accent="text-violet-600"
        />
        <MetricTile
          icon={BarChart3}
          label="Asignaciones"
          value={stats?.myAssignments ?? 0}
          accent="text-amber-600"
        />
      </div>

      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progreso de clientes
          </CardTitle>
          <CardDescription>
            Mediciones y avances recientes de quienes tienes asignados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientProgressCard
            clientProgress={clientProgress}
            onOpenClient={(clientId) => {
              const client = clientProgress.find(
                (item) => item.clientId === clientId || item.clientEmail === clientId,
              )
              if (!client?.clientId || !portalSlug) return
              router.push(`/portal/${portalSlug}/clients/${client.clientId}`)
            }}
          />
        </CardContent>
      </Card>
    </DashboardSectionShell>
  )
}
