"use client"

import { StatsCard } from "./stats-card"
import { UsersTable } from "./users-table"
import { ActivityFeed } from "./activity-feed"
import { Users, Dumbbell, TrendingUp } from "lucide-react"
import { mockUsers } from "@/lib/auth"

export function AdminDashboard() {
  const totalUsers = mockUsers.length
  const trainers = mockUsers.filter((u) => u.role === "trainer").length
  const clients = mockUsers.filter((u) => u.role === "client").length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-balance">Panel de Administración</h2>
        <p className="text-muted-foreground mt-2">Gestiona usuarios, visualiza métricas y controla la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Usuarios"
          value={totalUsers}
          description="Usuarios registrados"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Entrenadores"
          value={trainers}
          description="Entrenadores activos"
          icon={Dumbbell}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Clientes"
          value={clients}
          description="Clientes activos"
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Sesiones Activas"
          value="24"
          description="Sesiones este mes"
          icon={TrendingUp}
          trend={{ value: 20, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Gestión de Usuarios</h3>
              <p className="text-sm text-muted-foreground mt-1">Administra roles y permisos de usuarios</p>
            </div>
            <UsersTable users={mockUsers} />
          </div>
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
