"use client"

import { StatsCard } from "@/components/admin/stats-card"
import { DashboardNavAction } from "@/components/dashboard/dashboard-nav-action"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChartNoAxesCombined,
  Dumbbell,
  LayoutDashboard,
  ShoppingBag,
  Users
} from "lucide-react"

type DashboardStats = {
  totalUsers?: number
  totalTrainers?: number
  totalClients?: number
}

export type AdminDashboardView = "home" | "metrics" | "users" | "inventory"

interface AdminHomeSectionProps {
  stats: DashboardStats | null
  onNavigate: (view: AdminDashboardView) => void
}

export function AdminHomeSection({ stats, onNavigate }: AdminHomeSectionProps) {
  return (
    <div className="w-full space-y-6 xl:px-2 2xl:px-4">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative space-y-6">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3 w-3" />
              Panel de administración
            </Badge>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Centro de control
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Elige una sección para gestionar usuarios, revisar métricas o administrar el
              inventario del gimnasio.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            {/* <StatsCard
              title="Seguridad"
              value={"OK" as never}
              description="Acceso controlado"
              icon={ShieldCheck}
              trend={{ value: 100, isPositive: true }}
            /> */}
          </div>

          <Separator className="opacity-50" />

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Ir a una sección</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DashboardNavAction
                icon={Users}
                label="Usuarios y clientes"
                onClick={() => onNavigate("users")}
                accent="bg-blue-500/15 text-blue-600"
              />
              <DashboardNavAction
                icon={ChartNoAxesCombined}
                label="Bitacora"
                onClick={() => onNavigate("metrics")}
                accent="bg-amber-500/15 text-amber-600"
              />
              <DashboardNavAction
                icon={ShoppingBag}
                label="Inventario"
                onClick={() => onNavigate("inventory")}
                accent="bg-violet-500/15 text-violet-600"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
