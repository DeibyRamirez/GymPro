"use client"

import { DashboardNavAction } from "@/components/dashboard/dashboard-nav-action"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart3, Dumbbell, LayoutDashboard, Users, UtensilsCrossed, type LucideIcon } from "lucide-react"

export type TrainerDashboardView = "home" | "metrics" | "clients" | "programs"

type TrainerStats = {
  myClients: number
  myRoutines: number
  myMealPlans: number
  myAssignments: number
}

interface TrainerHomeSectionProps {
  stats: TrainerStats | null
  onNavigate: (view: TrainerDashboardView) => void
}

function StatPill({
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
    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

export function TrainerHomeSection({ stats, onNavigate }: TrainerHomeSectionProps) {
  return (
    <div className="w-full space-y-6 xl:px-2 2xl:px-4">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative space-y-6">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3 w-3" />
              Panel de entrenador
            </Badge>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Tu espacio de trabajo
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Accede por secciones: métricas de seguimiento, gestión de clientes y programación
              de rutinas, planes y clases.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill
              icon={Users}
              label="Clientes"
              value={stats?.myClients ?? 0}
              accent="bg-primary/10 text-primary"
            />
            <StatPill
              icon={Dumbbell}
              label="Rutinas"
              value={stats?.myRoutines ?? 0}
              accent="bg-accent/10 text-accent"
            />
            <StatPill
              icon={UtensilsCrossed}
              label="Planes"
              value={stats?.myMealPlans ?? 0}
              accent="bg-violet-500/10 text-violet-600"
            />
            <StatPill
              icon={BarChart3}
              label="Asignaciones"
              value={stats?.myAssignments ?? 0}
              accent="bg-amber-500/10 text-amber-600"
            />
          </div>

          <Separator className="opacity-50" />

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Ir a una sección</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DashboardNavAction
                icon={BarChart3}
                label="Métricas"
                onClick={() => onNavigate("metrics")}
                accent="bg-amber-500/15 text-amber-600"
              />
              <DashboardNavAction
                icon={Users}
                label="Mis clientes"
                onClick={() => onNavigate("clients")}
                accent="bg-blue-500/15 text-blue-600"
              />
              <DashboardNavAction
                icon={Dumbbell}
                label="Programación"
                onClick={() => onNavigate("programs")}
                accent="bg-emerald-500/15 text-emerald-600"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
