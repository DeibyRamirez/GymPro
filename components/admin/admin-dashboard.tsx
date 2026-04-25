"use client"

import { StatsCard } from "./stats-card"
import { UsersTable } from "./users-table"
import { ActivityFeed } from "./activity-feed"
import { InventoryPosPanel } from "./inventory-pos-panel"
import { Users, Dumbbell } from "lucide-react"
import { useEffect, useState } from "react"
import type { User } from "@/lib/auth"

type DashboardStats = {
  totalUsers?: number
  totalTrainers?: number
  totalClients?: number
  recentUsers?: User[]
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<User & { trainerId?: string; isActive?: boolean }>>([])

  useEffect(() => {
    async function fetchDashboardAdmin() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/dashboard/stats", { method: "GET", credentials: "include" }),
          fetch("/api/users", { method: "GET", credentials: "include" }),
        ])

        const statsData = await statsRes.json()
        const usersData = await usersRes.json()
        setStats(statsData.stats)
        setUsers(usersData.users || [])
      } catch (err: unknown) {
        console.log("Error al obtener dashboard", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardAdmin()
  }, [])

  const refreshAdminData = async () => {
    const [statsRes, usersRes] = await Promise.all([
      fetch("/api/dashboard/stats", { method: "GET", credentials: "include" }),
      fetch("/api/users", { method: "GET", credentials: "include" }),
    ])

    const statsData = await statsRes.json()
    const usersData = await usersRes.json()
    setStats(statsData.stats)
    setUsers(usersData.users || [])
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-balance">Panel de Administración</h2>
        <p className="text-muted-foreground mt-2">Gestiona usuarios, visualiza métricas y controla la plataforma</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Usuarios"
          value={stats?.totalUsers}
          description="Usuarios registrados"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Entrenadores"
          value={stats?.totalTrainers}
          description="Entrenadores activos"
          icon={Dumbbell}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Clientes"
          value={stats?.totalClients}
          description="Clientes activos"
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        {/* <StatsCard
          title="Sesiones Activas"
          value="24"
          description="Sesiones este mes"
          icon={TrendingUp}
          trend={{ value: 20, isPositive: true }}
        /> */}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">Gestión de Usuarios</h3>
              <p className="text-sm text-muted-foreground">Administra roles y permisos de usuarios</p>
            </div>
            <UsersTable
              users={users}
              onRefresh={refreshAdminData}
            />
          </div>
        </div>
        <div className="space-y-5">
          <ActivityFeed />
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Inventario y POS</h3>
        <InventoryPosPanel />
      </div>
    </div>
  )
}
