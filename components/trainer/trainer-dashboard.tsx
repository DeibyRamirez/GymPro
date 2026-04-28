"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { BarChart3, Dumbbell, LayoutDashboard, Users, UtensilsCrossed } from "lucide-react"
import { useEffect, useState } from "react"
import { ClientProgressCard } from "./client-progress-card"
import { ClientsView } from "./clients-view"
import { GroupClassesPanel } from "./group-classes-panel"
import { MealPlansLibrary } from "./meal-plans-library"
import { TrainerInbox } from "./trainer-inbox"
import { RoutinesLibrary } from "./routines-library"


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

function StatPill({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold">{value}</p></div>
    </div>
  )
}

function NavAction({ icon: Icon, label, onClick, accent }: { icon: React.ElementType; label: string; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2 rounded-2xl border bg-card/60 px-5 py-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${accent}`}><Icon className="h-5 w-5" /></div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  )
}

// function MiniMetric({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
//   return (
//     <div className="rounded-2xl border bg-card p-4 shadow-sm">
//       <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={`h-4 w-4 ${accent}`} />{label}</div>
//       <div className="mt-2 text-2xl font-black">{value}</div>
//     </div>
//   )
// }

export function TrainerDashboard({ trainerId }: TrainerDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("clients")
  const [stats, setStats] = useState<TrainerStats | null>(null)
  const [clientProgress, setClientProgress] = useState<ClientProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const portalSlug = typeof window !== "undefined" ? window.location.pathname.split('/')[2] : ''

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
    return () => { mounted = false; window.clearInterval(interval) }
  }, [trainerId])

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div className="w-full space-y-6 xl:px-2 2xl:px-4">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs"><LayoutDashboard className="h-3 w-3" /> Panel de entrenador</Badge>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Gestiona clientes, rutinas y nutrición</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Tu operación diaria en una sola vista, con acceso rápido a asignaciones, planes y clases.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            <StatPill icon={Users} label="Clientes" value={stats?.myClients ?? 0} accent="bg-primary/10 text-primary" />
            <StatPill icon={Dumbbell} label="Rutinas" value={stats?.myRoutines ?? 0} accent="bg-accent/10 text-accent" />
            <StatPill icon={UtensilsCrossed} label="Planes" value={stats?.myMealPlans ?? 0} accent="bg-violet-500/10 text-violet-600" />
            <StatPill icon={BarChart3} label="Asignaciones" value={stats?.myAssignments ?? 0} accent="bg-amber-500/10 text-amber-600" />
          </div>
        </div>

        <Separator className="my-6 opacity-50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NavAction icon={Users} label="Mis clientes" onClick={() => setActiveTab("clients")} accent="bg-blue-500/15 text-blue-600" />
          <NavAction icon={Dumbbell} label="Rutinas" onClick={() => setActiveTab("routines")} accent="bg-emerald-500/15 text-emerald-600" />
          <NavAction icon={UtensilsCrossed} label="Planes" onClick={() => setActiveTab("meals")} accent="bg-violet-500/15 text-violet-600" />
          <NavAction icon={BarChart3} label="Clases" onClick={() => setActiveTab("classes")} accent="bg-amber-500/15 text-amber-600" />
        </div>
      </section>

      {/* <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Clientes activos" value={stats?.myClients ?? 0} icon={Users} accent="text-primary" />
        <MiniMetric label="Rutinas creadas" value={stats?.myRoutines ?? 0} icon={Dumbbell} accent="text-accent" />
        <MiniMetric label="Planes alimenticios" value={stats?.myMealPlans ?? 0} icon={UtensilsCrossed} accent="text-violet-600" />
        <MiniMetric label="Progreso reciente" value={clientProgress.length} icon={Activity} accent="text-amber-600" />
      </section> */}

      <ClientProgressCard
        clientProgress={clientProgress}
        onOpenClient={(clientId) => {
          const client = clientProgress.find((item) => item.clientId === clientId || item.clientEmail === clientId)
          if (!client?.clientId) return
          router.push(`/portal/${portalSlug}/clients/${client.clientId}`)
        }}
      />
      <TrainerInbox trainerId={trainerId} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* <TabsList className="grid h-auto w-full grid-cols-4 p-1">
          <TabsTrigger value="clients" className="gap-2 py-3"><Users className="h-4 w-4" /><span className="hidden sm:inline">Mis Clientes</span><span className="sm:hidden">Clientes</span></TabsTrigger>
          <TabsTrigger value="routines" className="gap-2 py-3"><Dumbbell className="h-4 w-4" /><span className="hidden sm:inline">Rutinas</span><span className="sm:hidden">Rutinas</span></TabsTrigger>
          <TabsTrigger value="meals" className="gap-2 py-3"><UtensilsCrossed className="h-4 w-4" /><span className="hidden sm:inline">Planes</span><span className="sm:hidden">Planes</span></TabsTrigger>
          <TabsTrigger value="classes" className="gap-2 py-3"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Clases</span><span className="sm:hidden">Clases</span></TabsTrigger>
        </TabsList> */}

        <TabsContent value="clients" className="space-y-4"><ClientsView trainerId={trainerId} /></TabsContent>
        <TabsContent value="routines" className="space-y-4"><RoutinesLibrary trainerId={trainerId} /></TabsContent>
        <TabsContent value="meals" className="space-y-4"><MealPlansLibrary trainerId={trainerId} /></TabsContent>
        <TabsContent value="classes" className="space-y-4"><GroupClassesPanel trainerId={trainerId} /></TabsContent>
      </Tabs>
    </div>
  )
}
