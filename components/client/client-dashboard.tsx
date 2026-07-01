"use client"

import { RoutineDetailView } from "@/components/routines/routine-detail-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { Achievement } from "@/lib/achievements"
import type { User } from "@/lib/auth"
import type { Routine as BaseRoutine } from "@/lib/data"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
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
  Target,
  Trophy,
  Utensils,
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

interface ClientDashboardProps {
  client: User
  profileRequest?: number
}

type ClientDashboardView = "dashboard" | "calendar" | "body" | "messages" | "reports" | "profile"

type AssignedRoutineForView = Omit<BaseRoutine, 'exercises'> & {
  id?: string
  assignmentId?: string
  routineProgress?: Array<{ routineId: string; exerciseId: string; setNumber: number; dateKey?: string | null; completedAt: string }>
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
  badgeCount = 0,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  accent: string
  badgeCount?: number
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 rounded-2xl border bg-card/60 px-5 py-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md"
    >
      <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${accent}`}>
        <Icon className="h-5 w-5" />
        {badgeCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  )
}

const ACHIEVEMENT_CATEGORY_ORDER: Achievement["category"][] = [
  "measurement",
  "goal",
  "routine",
  "nutrition",
  "consistency",
]

function sortAchievements(items: Achievement[]) {
  return [...items].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    const categoryDiff =
      ACHIEVEMENT_CATEGORY_ORDER.indexOf(a.category) -
      ACHIEVEMENT_CATEGORY_ORDER.indexOf(b.category)
    if (categoryDiff !== 0) return categoryDiff
    return a.title.localeCompare(b.title, "es")
  })
}

function getAchievementIcon(id: string): LucideIcon {
  if (id.startsWith("routine")) return Dumbbell
  if (id.startsWith("nutrition")) return Utensils
  if (id.includes("goal") || id.includes("profile")) return Target
  if (id.includes("streak") || id.includes("day")) return Flame
  if (id.includes("measurement") || id.startsWith("first-measurement") || id.startsWith("ten-measurements") || id.startsWith("first-month")) {
    return Scale
  }
  return Medal
}

// ── Achievement badge ──────────────────────────────────────────────────────
function AchievementItem({
  icon: Icon,
  title,
  description,
  unlocked,
  progressPercent,
}: {
  icon: LucideIcon
  title: string
  description: string
  unlocked: boolean
  progressPercent?: number
}) {
  return (
    <div className={`rounded-2xl border p-3 transition-colors h-full ${unlocked ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              {unlocked ? (
                <Badge variant="secondary" className="shrink-0 px-1.5 text-[10px]">
                  <CheckCircle2 className="mr-0.5 h-3 w-3" />
                  OK
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {!unlocked && typeof progressPercent === "number" ? (
          <div className="mt-auto space-y-1 pt-1">
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">{progressPercent}%</p>
          </div>
        ) : null}
      </div>
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
  icon: LucideIcon
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
export function ClientDashboard({ client, profileRequest = 0 }: ClientDashboardProps) {
  const [view, setView] = useState<ClientDashboardView>("dashboard")
  const [viewingRoutine, setViewingRoutine] = useState<AssignedRoutineForView | null>(null)
  const [workoutDate, setWorkoutDate] = useState<string | undefined>(undefined)
  const [viewingMealPlan, setViewingMealPlan] = useState<AssignedMealPlanForView | null>(null)
  const [loading, setLoading] = useState(true)
  const [routine, setRoutine] = useState<AssignedRoutineForView | null>(null)
  const [activeAssignment, setActiveAssignment] = useState<{
    id?: string
    _id?: string
    routineProgress?: AssignedRoutineForView["routineProgress"]
  } | null>(null)
  const [mealPlan, setMealPlan] = useState<AssignedMealPlanForView | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [showCreateRoutine, setShowCreateRoutine] = useState(false)
  const lastLoadedKeyRef = useRef<string | null>(null)
  const lastProfileRequestRef = useRef(0)

  useEffect(() => {
    if (profileRequest > lastProfileRequestRef.current) {
      lastProfileRequestRef.current = profileRequest
      setView("profile")
    }
  }, [profileRequest])

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

  const refreshUnreadMessages = useCallback(async () => {
    const response = await fetch("/api/messages/unread-count", { credentials: "include" })
    if (!response.ok) return
    const data = await response.json()
    setUnreadMessages(data.unreadCount ?? 0)
  }, [])

  const handleMessagesRead = useCallback(() => {
    setUnreadMessages(0)
  }, [])

  const reloadAssignments = useCallback(async () => {
    const res = await fetch("/api/assignments", { credentials: "include" })
    if (!res.ok) return
    const data = await res.json()
    const active = data.assignments?.[0]
    if (active) {
      setActiveAssignment({
        id: active.id || active._id,
        _id: active._id || active.id,
        routineProgress: active.routineProgress || [],
      })
    }
    if (active?.routineId) {
      setRoutine({
        ...active.routineId,
        id: active.routineId.id || active.routineId._id,
        assignmentId: active.id || active._id,
        routineProgress: active.routineProgress || [],
      } as AssignedRoutineForView)
    } else {
      setRoutine(null)
    }
    if (active?.mealPlanId) setMealPlan(normalizeMealPlan(active.mealPlanId))
    else setMealPlan(null)
  }, [normalizeMealPlan])

  const openWorkoutForDay = useCallback(async (dateKey: string, dayRoutineId?: string) => {
    const targetRoutineId = dayRoutineId || routine?.id
    if (!targetRoutineId) return

    try {
      const res = await fetch(`/api/routines/${targetRoutineId}`, { credentials: "include" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar la rutina del día")

      const routineDoc = data.routine || data
      setViewingRoutine({
        ...routineDoc,
        id: routineDoc.id || routineDoc._id,
        assignmentId: activeAssignment?.id || activeAssignment?._id || routine?.assignmentId,
        routineProgress: activeAssignment?.routineProgress || routine?.routineProgress || [],
      } as AssignedRoutineForView)
      setWorkoutDate(dateKey)
      setView("dashboard")
    } catch (error) {
      console.error(error)
    }
  }, [routine, activeAssignment])

  useEffect(() => {
    const load = async () => {
      const loadKey = `${client.id}:${client.trainerId || ""}`
      if (lastLoadedKeyRef.current === loadKey) return
      lastLoadedKeyRef.current = loadKey

      setLoading(true)
      try {
        await reloadAssignments()
        const progressResponse = await fetch(`/api/users/${client.id}/progress`, { credentials: "include" })
        if (progressResponse.ok) {
          const progressData = await progressResponse.json()
          setAchievements(progressData.achievements || [])
        }
        if (client.trainerId) {
          const trainerResponse = await fetch(`/api/users/${client.trainerId}`, { credentials: "include" })
          if (trainerResponse.ok) {
            const trainerData = await trainerResponse.json()
            setTrainer(trainerData.user)
          }
        }
        await refreshUnreadMessages()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client.id, client.trainerId, reloadAssignments, refreshUnreadMessages])

  useEffect(() => {
    if (view !== "dashboard") return

    const intervalId = window.setInterval(() => {
      void refreshUnreadMessages()
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [view, refreshUnreadMessages])

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
  if (view === "calendar")
    return (
      <CalendarDashboard
        onBack={() => setView("dashboard")}
        assignmentId={routine?.assignmentId || activeAssignment?.id || activeAssignment?._id}
        onOpenWorkout={(dateKey, dayRoutineId) => {
          void openWorkoutForDay(dateKey, dayRoutineId)
        }}
      />
    )
  if (view === "body") return <BodyProgressDashboard onBack={() => setView("dashboard")} userId={client.id} gender={client.gender} />
  if (view === "messages") {
    return (
      <MessagesDashboard
        onBack={() => {
          setView("dashboard")
          void refreshUnreadMessages()
        }}
        onMessagesRead={handleMessagesRead}
        userId={client.id}
        trainerId={trainer?.id || client.trainerId}
      />
    )
  }
  if (view === "reports")
    return (
      <ReportsDashboard
        onBack={() => setView("dashboard")}
        userId={client.id}
        clientName={client.name}
      />
    )
  if (viewingRoutine)
    return (
      <RoutineDetailView
        routine={viewingRoutine}
        workoutDate={workoutDate}
        onBack={() => {
          setViewingRoutine(null)
          setWorkoutDate(undefined)
        }}
      />
    )
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
  const unlockedAchievements = achievements.filter((item) => item.unlocked).length
  const sortedAchievements = sortAchievements(achievements)

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
          <NavAction
            icon={MessageSquare}
            label="Mensajes"
            onClick={() => setView("messages")}
            accent="bg-violet-500/15 text-violet-600 dark:text-violet-400"
            badgeCount={unreadMessages}
          />
          <NavAction icon={FileText} label="Reportes" onClick={() => setView("reports")} accent="bg-amber-500/15 text-amber-600 dark:text-amber-400" />
        </div>
      </section>

      {/* ── PROGRESS ─────────────────────────────────────────────────────── */}
      <section>
        <ProgressOverview clientId={client.id} />
      </section>

      {/* ── PLAN ACTUAL + LOGROS ─────────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base font-semibold">Plan actual</CardTitle>
              <CardDescription className="text-xs">
                Rutina y alimentación asignadas por tu entrenador
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-5">
              <PlanSection
                icon={Dumbbell}
                label="Rutina"
                name={routine?.name}
                meta={routine?.exercises?.length ? `${routine.exercises.length} ejercicios` : undefined}
                empty="Sin rutina asignada"
                onView={() => {
                  setWorkoutDate(new Date().toISOString().slice(0, 10))
                  setViewingRoutine(routine)
                }}
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

          {trainer ? <TrainerInfoCard trainer={trainer} /> : null}
        </div>

        <Card className="flex max-h-[min(640px,70vh)] flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Trophy className="h-4 w-4 text-amber-500" />
              Logros
            </CardTitle>
            <CardDescription className="text-xs">
              {achievements.length > 0
                ? `${unlockedAchievements}/${achievements.length} logros desbloqueados`
                : "Medallas automáticas según tu progreso real"}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
            {sortedAchievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Completa mediciones, rutinas y nutrición para desbloquear logros.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sortedAchievements.map((achievement) => (
                  <AchievementItem
                    key={achievement.id}
                    icon={getAchievementIcon(achievement.id)}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                    progressPercent={achievement.progressPercent}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <CreateRoutineDialog
        open={showCreateRoutine}
        onOpenChange={setShowCreateRoutine}
        onSuccess={handleRoutineCreated}
      />
    </div>
  )
}
