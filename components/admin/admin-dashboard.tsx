"use client"

import { AdminHomeSection, type AdminDashboardView } from "@/components/admin/admin-home-section"
import { AdminInventorySection } from "@/components/admin/admin-inventory-section"
import { AdminMetricsSection } from "@/components/admin/admin-metrics-section"
import { AdminProfile } from "@/components/admin/admin-profile"
import { AdminUsersSection } from "@/components/admin/admin-users-section"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/auth"
import { ArrowLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type DashboardStats = { totalUsers?: number; totalTrainers?: number; totalClients?: number; recentUsers?: User[] }
type CurrentMe = { user?: { gymSlug?: string | null; gymName?: string | null } }

interface AdminDashboardProps {
  profileRequest?: number
}

export function AdminDashboard({ profileRequest = 0 }: AdminDashboardProps) {
  const [view, setView] = useState<AdminDashboardView | "profile">("home")
  const lastProfileRequestRef = useRef(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<User & { trainerId?: string; isActive?: boolean }>>([])
  const [gymSlug, setGymSlug] = useState<string>("")
  const [gymName, setGymName] = useState<string>("")

  useEffect(() => {
    async function fetchDashboardAdmin() {
      try {
        const [statsRes, usersRes, meRes] = await Promise.all([
          fetch("/api/dashboard/stats", { method: "GET", credentials: "include" }),
          fetch("/api/users", { method: "GET", credentials: "include" }),
          fetch("/api/auth/me", { credentials: "include" }),
        ])

        const statsData = await statsRes.json()
        const usersData = await usersRes.json()
        const meData = (await meRes.json()) as CurrentMe

        setStats(statsData.stats)
        setUsers(usersData.users || [])
        setGymSlug(meData.user?.gymSlug || "")
        setGymName(meData.user?.gymName || "")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardAdmin()
  }, [])

  useEffect(() => {
    if (profileRequest > lastProfileRequestRef.current) {
      lastProfileRequestRef.current = profileRequest
      setView("profile")
    }
  }, [profileRequest])

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (view === "metrics") {
    return (
      <AdminMetricsSection
        stats={stats}
        gymSlug={gymSlug}
        gymName={gymName}
        onBack={() => setView("home")}
      />
    )
  }

  if (view === "users") {
    return (
      <AdminUsersSection
        users={users}
        onRefresh={refreshAdminData}
        onBack={() => setView("home")}
      />
    )
  }

  if (view === "inventory") {
    return (
      <AdminInventorySection
        gymSlug={gymSlug}
        gymName={gymName}
        onBack={() => setView("home")}
      />
    )
  }

  if (view === "profile") {
    return (
      <div className="w-full space-y-6 xl:px-2 2xl:px-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            <p className="mt-1 text-muted-foreground">
              Actualiza tu información personal y la identidad del gimnasio
            </p>
          </div>
          <Button variant="outline" onClick={() => setView("home")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
        <AdminProfile gymSlug={gymSlug} />
      </div>
    )
  }

  return <AdminHomeSection stats={stats} onNavigate={setView} />
}
