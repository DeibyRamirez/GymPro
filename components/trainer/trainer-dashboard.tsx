"use client"

import { TrainerClientsSection } from "@/components/trainer/trainer-clients-section"
import { TrainerHomeSection, type TrainerDashboardView } from "@/components/trainer/trainer-home-section"
import { TrainerMetricsSection } from "@/components/trainer/trainer-metrics-section"
import { TrainerProgramsSection } from "@/components/trainer/trainer-programs-section"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface TrainerDashboardProps {
  trainerId: string
}

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
  clientProgress?: ClientProgressItem[]
}

export function TrainerDashboard({ trainerId }: TrainerDashboardProps) {
  const [view, setView] = useState<TrainerDashboardView>("home")
  const [stats, setStats] = useState<TrainerStats | null>(null)
  const [clientProgress, setClientProgress] = useState<ClientProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const portalSlug = pathname.split("/")[2] || ""

  useEffect(() => {
    let mounted = true

    async function fetchDashboardTrainer() {
      try {
        const res = await fetch("/api/dashboard/stats", { method: "GET", credentials: "include" })
        const data = await res.json()
        const nextStats = (data?.stats ?? null) as TrainerStats | null

        if (mounted) {
          setStats(nextStats)
          setClientProgress(nextStats?.clientProgress || [])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboardTrainer()
    const interval = window.setInterval(fetchDashboardTrainer, 30000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [trainerId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (view === "metrics") {
    return (
      <TrainerMetricsSection
        stats={stats}
        clientProgress={clientProgress}
        portalSlug={portalSlug}
        onBack={() => setView("home")}
      />
    )
  }

  if (view === "clients") {
    return <TrainerClientsSection trainerId={trainerId} onBack={() => setView("home")} />
  }

  if (view === "programs") {
    return <TrainerProgramsSection trainerId={trainerId} onBack={() => setView("home")} />
  }

  return <TrainerHomeSection stats={stats} onNavigate={setView} />
}
