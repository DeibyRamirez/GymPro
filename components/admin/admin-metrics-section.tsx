"use client"

import { ActivityFeed } from "@/components/admin/activity-feed"
import { StatsCard } from "@/components/admin/stats-card"
import { DashboardSectionShell } from "@/components/dashboard/dashboard-section-shell"
import { Dumbbell, ShieldCheck, Users } from "lucide-react"

type DashboardStats = {
  totalUsers?: number
  totalTrainers?: number
  totalClients?: number
}

interface AdminMetricsSectionProps {
  stats: DashboardStats | null
  gymSlug: string
  gymName?: string
  onBack: () => void
}

export function AdminMetricsSection({
  stats,
  gymSlug,
  gymName,
  onBack,
}: AdminMetricsSectionProps) {
  return (
    <DashboardSectionShell
      title="Métricas y actividad"
      description="Resumen numérico del gimnasio y bitácora de eventos recientes."
      onBack={onBack}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Usuarios"
          value={stats?.totalUsers ?? 0}
          description="Registrados"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Entrenadores"
          value={stats?.totalTrainers ?? 0}
          description="Activos"
          icon={Dumbbell}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Clientes"
          value={stats?.totalClients ?? 0}
          description="Activos"
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Seguridad"
          value={"OK" as never}
          description="Acceso controlado"
          icon={ShieldCheck}
          trend={{ value: 100, isPositive: true }}
        />
      </div>

      <ActivityFeed gymSlug={gymSlug} gymName={gymName} />
    </DashboardSectionShell>
  )
}
