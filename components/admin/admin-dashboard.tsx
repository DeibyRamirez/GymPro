"use client"

import { AdminHomeSection, type AdminDashboardView } from "@/components/admin/admin-home-section"
import { AdminInventorySection } from "@/components/admin/admin-inventory-section"
import { AdminMetricsSection } from "@/components/admin/admin-metrics-section"
import { AdminUsersSection } from "@/components/admin/admin-users-section"
import type { User } from "@/lib/auth"
import { useEffect, useState } from "react"

type GymItem = { id: string; name: string; slug: string; location: string; status: string; adminEmail?: string }
type DashboardStats = { totalUsers?: number; totalTrainers?: number; totalClients?: number; recentUsers?: User[] }
type CurrentMe = { user?: { gymSlug?: string | null } }

export function AdminDashboard() {
  const [view, setView] = useState<AdminDashboardView>("home")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<User & { trainerId?: string; isActive?: boolean }>>([])
  const [gyms, setGyms] = useState<GymItem[]>([])
  const [selectedGymSlug, setSelectedGymSlug] = useState<string>("")

  useEffect(() => {
    async function fetchDashboardAdmin() {
      try {
        const [statsRes, usersRes, meRes, gymsRes] = await Promise.all([
          fetch("/api/dashboard/stats", { method: "GET", credentials: "include" }),
          fetch("/api/users", { method: "GET", credentials: "include" }),
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/gyms", { credentials: "include" }),
        ])

        const statsData = await statsRes.json()
        const usersData = await usersRes.json()
        const meData = (await meRes.json()) as CurrentMe
        const gymsData = await gymsRes.json()

        setStats(statsData.stats)
        setUsers(usersData.users || [])
        const adminGyms = (gymsData.gyms || []) as GymItem[]
        setGyms(adminGyms)
        setSelectedGymSlug(meData.user?.gymSlug || "")
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (view === "metrics") {
    const currentGym = gyms.find((gym) => gym.slug === selectedGymSlug)

    return (
      <AdminMetricsSection
        stats={stats}
        gymSlug={selectedGymSlug}
        gymName={currentGym?.name}
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
        gyms={gyms}
        selectedGymSlug={selectedGymSlug}
        onGymChange={setSelectedGymSlug}
        onBack={() => setView("home")}
      />
    )
  }

  return <AdminHomeSection stats={stats} onNavigate={setView} />
}
