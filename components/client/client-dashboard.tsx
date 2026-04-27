"use client"

import { RoutineDetailView } from "@/components/routines/routine-detail-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { User } from "@/lib/auth"
import type { Routine as BaseRoutine } from "@/lib/data"
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  FileText,
  Flame,
  LayoutDashboard,
  Loader2,
  Medal,
  MessageSquare,
  Plus,
  Scale,
  Star,
  Trophy,
  User as UserIcon,
  Utensils
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { MealPlanDetailView } from "../meal-plans/meal-plan-detail-view"
import { BodyProgressDashboard } from "./body-progress-dashboard"
import { CalendarDashboard } from "./calendar-dashboard"
import { ClientProfile } from "./client-profile"
import { CreateRoutineDialog } from "./create-routine-dialog"
import { MessagesDashboard } from "./messages-dashboard"
import { ProgressOverview } from "./progress-overview"
import { ReportsDashboard } from "./reports-dashboard"
import { TrainerInfoCard } from "./trainer-info-card"

interface ClientDashboardProps { client: User }

type AssignedRoutineForView = Omit<BaseRoutine, 'exercises'> & {
  assignmentId?: string
  routineProgress?: Array<{ routineId: string; exerciseId: string; setNumber: number; completedAt: string }>
  exercises: Array<{
    _id?: string
    exercise: { _id: string; name: string; image?: string; instructions?: string }
    sets: number
    reps: string
    rest: string
    instructions: string
  }>
}

type AssignedMealPlanForView = {
  id: string
  name: string
  description: string
  calories: number
  createdBy: string
  meals: Array<{
    id: string
    name: string
    time: string
    calories: number
    foods: string[]
    macros: { carbs: number; protein: number; fats: number }
  }>
}

interface Trainer {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
}

// ── Stat pill ──────────────────────────────────────────────────────────────
// function StatPill({
//   icon: Icon,
//   label,
//   value,
//   accent,
// }: {
//   icon: React.ElementType
//   label: string
//   value: string
//   accent: string
// }) {
//   return (
//     <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 backdrop-blur-sm">
//       <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
//         <Icon className="h-4 w-4" />
//       </div>
//       <div className="min-w-0">
//         <p className="truncate text-xs text-muted-foreground">{label}</p>
//         <p className="truncate text-sm font-semibold">{value}</p>
//       </div>
//     </div>
//   )
// }

// ── Nav pill button ────────────────────────────────────────────────────────
function NavAction({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl border bg-card/60 px-5 py-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  )
}

// ── Achievement badge ──────────────────────────────────────────────────────
function AchievementItem({
  icon: Icon,
  title,
  description,
  unlocked,
}: {
  icon: React.ElementType
  title: string
  description: string
  unlocked: boolean
}) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${unlocked ? "bg-primary/5 border-primary/20" : "opacity-60"}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {unlocked && (
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
          ✓ Desbloqueado
        </Badge>
      )}
    </div>
  )
}

// ── Plan card (routine / meal) ─────────────────────────────────────────────
function PlanSection({
  icon: Icon,
  label,
  name,
  meta,
  empty,
  onView,
  accent,
}: {
  icon: React.ElementType
  label: string
  name?: string
  meta?: string
  empty: string
  onView?: () => void
  accent: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {name ? (
        <button
          onClick={onView}
          className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all hover:shadow-md ${accent}`}
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {meta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : (
        <div className="rounded-2xl border border-dashed p-4">
          <p className="text-sm text-muted-foreground">{empty}</p>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function ClientDashboard({ client }: ClientDashboardProps) {
  const [view, setView] = useState<"dashboard" | "calendar" | "body" | "messages" | "reports" | "profile">("dashboard")
  const [viewingRoutine, setViewingRoutine] = useState<AssignedRoutineForView | null>(null)
  const [viewingMealPlan, setViewingMealPlan] = useState<AssignedMealPlanForView | null>(null)
  const [loading, setLoading] = useState(true)
  const [routine, setRoutine] = useState<AssignedRoutineForView | null>(null)
  const [mealPlan, setMealPlan] = useState<AssignedMealPlanForView | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [showCreateRoutine, setShowCreateRoutine] = useState(false)
  const lastLoadedKeyRef = useRef<string | null>(null)

  const normalizeMealPlan = useCallback((plan: unknown): AssignedMealPlanForView | null => {
    if (!plan || typeof plan !== "object") return null
    const data = plan as {
      id?: string; _id?: string; name?: string; description?: string; calories?: number; createdBy?: string
      meals?: Array<{ id?: string; name?: string; time?: string; calories?: number; foods?: string[]; macros?: { carbs?: number; protein?: number; fats?: number } }>
    }
    return {
      id: data.id || data._id || '',
      name: data.name || 'Plan alimenticio',
      description: data.description || '',
      calories: data.calories || 0,
      createdBy: data.createdBy || '',
      meals: (data.meals || []).map((meal, index) => ({
        id: meal.id || `${meal.name || 'meal'}-${index}`,
        name: meal.name || `Comida ${index + 1}`,
        time: meal.time || '--:--',
        calories: meal.calories || 0,
        foods: Array.isArray(meal.foods) ? meal.foods : [],
        macros: { carbs: meal.macros?.carbs || 0, protein: meal.macros?.protein || 0, fats: meal.macros?.fats || 0 },
      })),
    }
  }, [])

  const reloadAssignments = useCallback(async () => {
    const res = await fetch("/api/assignments", { credentials: "include" })
    if (!res.ok) return
    const data = await res.json()
    const activeAssignment = data.assignments?.[0]
    if (activeAssignment?.routineId) {
      setRoutine({
        ...activeAssignment.routineId,
        id: activeAssignment.routineId.id || activeAssignment.routineId._id,
        assignmentId: activeAssignment.id || activeAssignment._id,
        routineProgress: activeAssignment.routineProgress || [],
      } as AssignedRoutineForView)
    }
    if (activeAssignment?.mealPlanId) setMealPlan(normalizeMealPlan(activeAssignment.mealPlanId))
  }, [normalizeMealPlan])

  useEffect(() => {
    const load = async () => {
      const loadKey = `${client.id}:${client.trainerId || ""}`
      if (lastLoadedKeyRef.current === loadKey) return
      lastLoadedKeyRef.current = loadKey

      setLoading(true)
      try {
        await reloadAssignments()
        if (client.trainerId) {
          const trainerResponse = await fetch(`/api/users/${client.trainerId}`, { credentials: "include" })
          if (trainerResponse.ok) {
            const trainerData = await trainerResponse.json()
            setTrainer(trainerData.user)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client.id, client.trainerId, reloadAssignments])

  const handleRoutineCreated = async () => {
    await reloadAssignments()
    setShowCreateRoutine(false)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Sub-views ────────────────────────────────────────────────────────────
  if (view === "calendar") return <CalendarDashboard onBack={() => setView("dashboard")} assignmentId={routine?.assignmentId} />
  if (view === "body") return <BodyProgressDashboard onBack={() => setView("dashboard")} userId={client.id} />
  if (view === "messages") return <MessagesDashboard onBack={() => setView("dashboard")} userId={client.id} trainerId={trainer?.id || client.trainerId} />
  if (view === "reports") return <ReportsDashboard onBack={() => setView("dashboard")} userId={client.id} />
  if (viewingRoutine) return <RoutineDetailView routine={viewingRoutine} onBack={() => setViewingRoutine(null)} />
  if (viewingMealPlan) return <MealPlanDetailView mealPlan={viewingMealPlan} onBack={() => setViewingMealPlan(null)} />

  // ── Profile view ─────────────────────────────────────────────────────────
  if (view === "profile") {
    return (
      <div className="w-full space-y-6 xl:px-2 2xl:px-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            <p className="mt-1 text-muted-foreground">Actualiza tu información personal y del gimnasio</p>
          </div>
          <Button variant="outline" onClick={() => setView("dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
        <ClientProfile clientId={client.id} onUpdate={() => setView("dashboard")} />
      </div>
    )
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  const firstName = client.name.split(" ")[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"

  return (
    <div className="w-full space-y-6 xl:px-2 2xl:px-4">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-primary/10" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          {/* Left: greeting + actions */}
          <div className="space-y-1">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3 w-3" />
              Panel del cliente
            </Badge>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              {greeting}, {firstName} 👋
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground">
              Tu entrenamiento, nutrición, mensajes, reportes y progreso corporal en un solo lugar.
            </p>
          </div>

          {/* Right: CTA buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Mi Perfil
            </Button>
            <Button size="sm" onClick={() => setShowCreateRoutine(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear rutina propia
            </Button>
          </div>
        </div>

        {/* Quick-nav grid */}
        <Separator className="my-6 opacity-50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NavAction icon={CalendarDays} label="Calendario" onClick={() => setView("calendar")} accent="bg-blue-500/15 text-blue-600 dark:text-blue-400" />
          <NavAction icon={Scale} label="Progreso" onClick={() => setView("body")} accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" />
          <NavAction icon={MessageSquare} label="Mensajes" onClick={() => setView("messages")} accent="bg-violet-500/15 text-violet-600 dark:text-violet-400" />
          <NavAction icon={FileText} label="Reportes" onClick={() => setView("reports")} accent="bg-amber-500/15 text-amber-600 dark:text-amber-400" />
        </div>
      </section>

      {/* ── PROGRESS ─────────────────────────────────────────────────────── */}
      <section>
        <ProgressOverview clientId={client.id} />
      </section>

      {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-3">

        {/* Left col — Plan actual ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Routine + Meal plan */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base font-semibold">Plan actual</CardTitle>
              <CardDescription className="text-xs">Rutina y alimentación asignadas por tu entrenador</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <PlanSection
                icon={Dumbbell}
                label="Rutina"
                name={routine?.name}
                meta={routine?.exercises?.length ? `${routine.exercises.length} ejercicios` : undefined}
                empty="Sin rutina asignada"
                onView={() => setViewingRoutine(routine)}
                accent="bg-primary/5 hover:bg-primary/10 border-primary/20"
              />
              <PlanSection
                icon={Utensils}
                label="Plan alimenticio"
                name={mealPlan?.name}
                meta={mealPlan?.calories ? `${mealPlan.calories} kcal / día` : undefined}
                empty="Sin plan alimenticio"
                onView={() => setViewingMealPlan(mealPlan)}
                accent="bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
              />
            </CardContent>
          </Card>

          {/* Entrenador */}
          {trainer && (
            <TrainerInfoCard trainer={trainer} />
          )}
        </div>

        {/* Right col — Logros ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Trophy className="h-4 w-4 text-amber-500" />
                Logros
              </CardTitle>
              <CardDescription className="text-xs">Medallas automáticas y estado de avance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <AchievementItem
                icon={Star}
                title="Primer registro"
                description="Ya guardaste tu primera medición corporal."
                unlocked
              />
              <AchievementItem
                icon={Flame}
                title="Racha consistente"
                description="Sigue entrenando para desbloquear más logros."
                unlocked={false}
              />
              <AchievementItem
                icon={Medal}
                title="Semana completa"
                description="Completa 7 días seguidos de entrenamiento."
                unlocked={false}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <CreateRoutineDialog
        open={showCreateRoutine}
        onOpenChange={setShowCreateRoutine}
        onSuccess={handleRoutineCreated}
      />
    </div>
  )
}
