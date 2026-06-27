"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Award,
  CalendarRange,
  Dumbbell,
  FileDown,
  FileText,
  Flame,
  Loader2,
  Scale,
  Target,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  User,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type Measurement = {
  id?: string
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  hips?: number
  arm?: number
  thigh?: number
  notes?: string
}

type Achievement = {
  id: string
  title: string
  description: string
  unlocked: boolean
}

type RoutineHistoryItem = {
  assignmentId: string
  routineName: string
  completedSets: number
  totalSets: number
  completionRate: number
  lastCompletedAt?: string | null
}

type ReportExercise = {
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
}

type ReportMeal = {
  name: string
  time: string
  calories: number
  foods: string[]
  macros?: { protein: number; carbs: number; fats: number }
}

type ReportAssignment = {
  id: string
  startDate?: string
  endDate?: string
  notes?: string
  trainerName?: string
  routine: {
    name: string
    description: string
    duration: string
    difficulty: string
    exercises: ReportExercise[]
  } | null
  mealPlan: {
    name: string
    description: string
    calories: number
    meals: ReportMeal[]
  } | null
}

interface ReportsDashboardProps {
  onBack: () => void
  userId: string
  clientName?: string
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

const ANTHRO_FIELDS = [
  { key: "weight" as const, label: "Peso", unit: "kg" },
  { key: "bodyFat" as const, label: "Grasa corporal", unit: "%" },
  { key: "chest" as const, label: "Pecho", unit: "cm" },
  { key: "waist" as const, label: "Cintura", unit: "cm" },
  { key: "hips" as const, label: "Cadera", unit: "cm" },
  { key: "arm" as const, label: "Brazo", unit: "cm" },
  { key: "thigh" as const, label: "Muslo", unit: "cm" },
]

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatValue(value?: number | null, unit = "") {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value}${unit ? ` ${unit}` : ""}`
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Scale
  label: string
  value: string
  hint?: string
  accent: string
}) {
  return (
    <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-3xl border bg-card/80 shadow-sm">
      <div className="border-b bg-muted/20 px-6 py-5">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function normalizeAssignment(raw: unknown): ReportAssignment | null {
  if (!raw || typeof raw !== "object") return null
  const item = raw as {
    id?: string
    _id?: string
    startDate?: string
    endDate?: string
    notes?: string
    trainerId?: { name?: string } | string
    routineId?: {
      name?: string
      description?: string
      duration?: string
      difficulty?: string
      exercises?: Array<{
        sets?: number
        reps?: string
        rest?: string
        instructions?: string
        exercise?: { name?: string; instructions?: string }
        name?: string
      }>
    } | null
    mealPlanId?: {
      name?: string
      description?: string
      calories?: number
      meals?: Array<{
        name?: string
        time?: string
        calories?: number
        foods?: string[]
        macros?: { protein?: number; carbs?: number; fats?: number }
      }>
    } | null
  }

  const id = item.id || item._id
  if (!id) return null

  const trainerName =
    typeof item.trainerId === "object" && item.trainerId?.name ? item.trainerId.name : undefined

  const routine = item.routineId
    ? {
        name: item.routineId.name || "Rutina asignada",
        description: item.routineId.description || "",
        duration: item.routineId.duration || "—",
        difficulty: item.routineId.difficulty || "intermediate",
        exercises: (item.routineId.exercises || []).map((entry, index) => ({
          name: entry.exercise?.name || entry.name || `Ejercicio ${index + 1}`,
          sets: entry.sets || 0,
          reps: entry.reps || "—",
          rest: entry.rest || "—",
          instructions: entry.instructions || entry.exercise?.instructions || "",
        })),
      }
    : null

  const mealPlan = item.mealPlanId
    ? {
        name: item.mealPlanId.name || "Plan alimenticio",
        description: item.mealPlanId.description || "",
        calories: item.mealPlanId.calories || 0,
        meals: (item.mealPlanId.meals || []).map((meal, index) => ({
          name: meal.name || `Comida ${index + 1}`,
          time: meal.time || "--:--",
          calories: meal.calories || 0,
          foods: Array.isArray(meal.foods) ? meal.foods : [],
          macros: {
            protein: meal.macros?.protein || 0,
            carbs: meal.macros?.carbs || 0,
            fats: meal.macros?.fats || 0,
          },
        })),
      }
    : null

  return {
    id,
    startDate: item.startDate,
    endDate: item.endDate,
    notes: item.notes,
    trainerName,
    routine,
    mealPlan,
  }
}

export function ReportsDashboard({ onBack, userId, clientName }: ReportsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [routineHistory, setRoutineHistory] = useState<RoutineHistoryItem[]>([])
  const [summary, setSummary] = useState({
    totalMeasurements: 0,
    longestWorkoutStreak: 0,
    latestMeasurement: null as Measurement | null,
  })
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [assignment, setAssignment] = useState<ReportAssignment | null>(null)
  const generatedAt = useMemo(() => new Date(), [])

  useEffect(() => {
    let active = true

    async function loadReport() {
      try {
        const [progressRes, assignmentsRes] = await Promise.all([
          fetch(`/api/users/${userId}/progress`, { credentials: "include" }),
          fetch("/api/assignments", { credentials: "include" }),
        ])

        if (progressRes.ok && active) {
          const progress = await progressRes.json()
          setMeasurements(progress.measurements || [])
          setAchievements(progress.achievements || [])
          setRoutineHistory(progress.routineHistory || [])
          setSummary(
            progress.summary || {
              totalMeasurements: 0,
              longestWorkoutStreak: 0,
              latestMeasurement: null,
            },
          )
        }

        if (assignmentsRes.ok && active) {
          const assignmentsData = await assignmentsRes.json()
          const activeAssignment = assignmentsData.assignments?.[0]
          const normalized = normalizeAssignment(activeAssignment)
          setAssignment(normalized)

          if (normalized?.id) {
            const streakRes = await fetch(`/api/assignments/${normalized.id}/day-complete`, {
              credentials: "include",
            })
            if (streakRes.ok && active) {
              const streakData = await streakRes.json()
              setStreak(streakData.streak || { current: 0, longest: 0 })
            }
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadReport()

    return () => {
      active = false
    }
  }, [userId])

  const unlockedAchievements = achievements.filter((item) => item.unlocked).length
  const firstMeasurement = measurements[0]
  const latestMeasurement = summary.latestMeasurement || measurements.at(-1) || null

  const anthropometricDelta = useMemo(() => {
    if (!firstMeasurement || !latestMeasurement || measurements.length < 2) return null
    return ANTHRO_FIELDS.map(({ key, label, unit }) => {
      const start = firstMeasurement[key]
      const end = latestMeasurement[key]
      if (start == null || end == null) return null
      const diff = Number((end - start).toFixed(1))
      return { label, unit, start, end, diff }
    }).filter(Boolean) as Array<{ label: string; unit: string; start: number; end: number; diff: number }>
  }, [firstMeasurement, latestMeasurement, measurements.length])

  const exportCsv = () => {
    const header = [
      "seccion",
      "campo",
      "valor",
    ]

    const rows: string[][] = [
      ["meta", "cliente", clientName || userId],
      ["meta", "fecha_reporte", generatedAt.toISOString()],
      ["meta", "racha_actual", String(streak.current)],
      ["meta", "mejor_racha", String(Math.max(streak.longest, summary.longestWorkoutStreak))],
    ]

    if (assignment?.routine) {
      rows.push(["rutina", "nombre", assignment.routine.name])
      rows.push(["rutina", "duracion", assignment.routine.duration])
      assignment.routine.exercises.forEach((exercise, index) => {
        rows.push(["rutina", `ejercicio_${index + 1}`, `${exercise.name} | ${exercise.sets}x${exercise.reps} | ${exercise.rest}`])
      })
    }

    if (assignment?.mealPlan) {
      rows.push(["plan", "nombre", assignment.mealPlan.name])
      rows.push(["plan", "calorias_diarias", String(assignment.mealPlan.calories)])
      assignment.mealPlan.meals.forEach((meal) => {
        rows.push(["plan", meal.name, `${meal.time} | ${meal.calories} kcal | ${meal.foods.join("; ")}`])
      })
    }

    measurements.forEach((measurement) => {
      ANTHRO_FIELDS.forEach(({ key, label, unit }) => {
        rows.push([
          formatDate(measurement.date),
          label,
          measurement[key] != null ? `${measurement[key]}${unit ? ` ${unit}` : ""}` : "",
        ])
      })
      if (measurement.notes) {
        rows.push([formatDate(measurement.date), "notas", measurement.notes])
      }
    })

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `informe-gympro-${userId}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasAnyData =
    measurements.length > 0 || assignment?.routine || assignment?.mealPlan || achievements.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!hasAnyData}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel / CSV
          </Button>
          <Button onClick={exportPdf} disabled={!hasAnyData}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div id="report-document" className="space-y-6 print:space-y-4">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-primary/10" />
          <div className="relative space-y-4">
            <Badge variant="outline" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Informe integral
            </Badge>
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Reporte de progreso</h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                Resumen claro de tu evolución corporal, constancia, rutina activa y plan alimenticio asignado.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</p>
                <p className="mt-1 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  {clientName || "Cliente"}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Entrenador</p>
                <p className="mt-1 font-semibold">{assignment?.trainerName || "Sin asignar"}</p>
              </div>
              <div className="rounded-2xl border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Generado</p>
                <p className="mt-1 font-semibold">{formatDate(generatedAt.toISOString())}</p>
              </div>
              <div className="rounded-2xl border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Programa</p>
                <p className="mt-1 font-semibold">
                  {assignment?.startDate ? `${formatDate(assignment.startDate)}${assignment.endDate ? ` → ${formatDate(assignment.endDate)}` : ""}` : "Sin fechas"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!hasAnyData ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Aún no hay suficiente información para generar un informe completo. Registra mediciones corporales o
              solicita a tu entrenador una rutina y plan alimenticio.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                icon={Scale}
                label="Mediciones"
                value={String(summary.totalMeasurements)}
                hint={latestMeasurement ? `Última: ${formatDate(latestMeasurement.date)}` : undefined}
                accent="bg-primary/10 text-primary"
              />
              <StatTile
                icon={TrendingUp}
                label="Racha actual"
                value={`${streak.current} días`}
                hint="Días consecutivos cumpliendo el día"
                accent="bg-emerald-500/10 text-emerald-600"
              />
              <StatTile
                icon={Trophy}
                label="Mejor racha"
                value={`${Math.max(streak.longest, summary.longestWorkoutStreak)} días`}
                hint="Histórico de constancia"
                accent="bg-amber-500/10 text-amber-600"
              />
              <StatTile
                icon={Award}
                label="Logros"
                value={`${unlockedAchievements}/${achievements.length}`}
                hint="Medallas desbloqueadas"
                accent="bg-violet-500/10 text-violet-600"
              />
            </div>

            <SectionShell
              title="Resumen ejecutivo"
              description="Panorama general de tu seguimiento en GymPro."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border bg-muted/20 p-5">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Target className="h-4 w-4 text-primary" />
                    Estado actual
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>
                      Tienes <strong className="text-foreground">{summary.totalMeasurements}</strong>{" "}
                      {summary.totalMeasurements === 1 ? "medición registrada" : "mediciones registradas"}.
                    </li>
                    <li>
                      Tu racha activa es de <strong className="text-foreground">{streak.current}</strong>{" "}
                      {streak.current === 1 ? "día" : "días"} y tu mejor marca alcanza{" "}
                      <strong className="text-foreground">{Math.max(streak.longest, summary.longestWorkoutStreak)}</strong>{" "}
                      días.
                    </li>
                    <li>
                      Programa asignado:{" "}
                      <strong className="text-foreground">
                        {assignment?.routine?.name || "Sin rutina"} · {assignment?.mealPlan?.name || "Sin plan"}
                      </strong>
                    </li>
                    {assignment?.notes ? (
                      <li>
                        Notas del entrenador: <em>{assignment.notes}</em>
                      </li>
                    ) : null}
                  </ul>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-5">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <CalendarRange className="h-4 w-4 text-accent" />
                    Cumplimiento de rutinas
                  </h4>
                  {routineHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin historial de series completadas todavía.</p>
                  ) : (
                    <div className="space-y-3">
                      {routineHistory.map((item) => (
                        <div key={item.assignmentId} className="rounded-xl border bg-background/80 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{item.routineName}</p>
                            <Badge variant="secondary">{item.completionRate}% series</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.completedSets} series registradas
                            {item.lastCompletedAt ? ` · última: ${formatDate(item.lastCompletedAt)}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionShell>

            <SectionShell
              title="Valores antropométricos"
              description="Medidas corporales registradas y evolución desde tu primer control."
            >
              {latestMeasurement ? (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Última medición · {formatDate(latestMeasurement.date)}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {ANTHRO_FIELDS.map(({ key, label, unit }) => (
                        <div key={key} className="rounded-2xl border bg-background/80 p-4">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                          <p className="mt-2 text-2xl font-bold tabular-nums">
                            {formatValue(latestMeasurement[key], unit)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {latestMeasurement.notes ? (
                      <p className="mt-4 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                        <strong className="text-foreground">Observaciones:</strong> {latestMeasurement.notes}
                      </p>
                    ) : null}
                  </div>

                  {anthropometricDelta && anthropometricDelta.length > 0 ? (
                    <div>
                      <p className="mb-3 text-sm font-medium">Variación desde la primera medición</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {anthropometricDelta.map((item) => (
                          <div key={item.label} className="rounded-xl border p-4">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.start}{item.unit} → {item.end}{item.unit}
                            </p>
                            <p className={`mt-2 text-lg font-bold ${item.diff > 0 ? "text-amber-600" : item.diff < 0 ? "text-emerald-600" : ""}`}>
                              {item.diff > 0 ? "+" : ""}
                              {item.diff}{item.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {measurements.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Fecha</th>
                            {ANTHRO_FIELDS.map(({ label }) => (
                              <th key={label} className="px-4 py-3 font-semibold">
                                {label}
                              </th>
                            ))}
                            <th className="px-4 py-3 font-semibold">Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...measurements].reverse().map((measurement, index) => (
                            <tr key={measurement.id || `${measurement.date}-${index}`} className="border-t">
                              <td className="px-4 py-3 whitespace-nowrap">{formatDate(measurement.date)}</td>
                              {ANTHRO_FIELDS.map(({ key, unit }) => (
                                <td key={key} className="px-4 py-3 tabular-nums">
                                  {formatValue(measurement[key], unit)}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-muted-foreground">{measurement.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay mediciones corporales registradas.</p>
              )}
            </SectionShell>

            {assignment?.routine ? (
              <SectionShell
                title="Rutina asignada"
                description="Programa de entrenamiento exacto vinculado a tu asignación activa."
              >
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="text-2xl font-bold">{assignment.routine.name}</h4>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {assignment.routine.description || "Sin descripción adicional."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        <Dumbbell className="mr-1 h-3.5 w-3.5" />
                        {assignment.routine.exercises.length} ejercicios
                      </Badge>
                      <Badge variant="outline">{assignment.routine.duration}</Badge>
                      <Badge variant="outline">
                        {DIFFICULTY_LABELS[assignment.routine.difficulty] || assignment.routine.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {assignment.routine.exercises.map((exercise, index) => (
                      <div key={`${exercise.name}-${index}`} className="rounded-2xl border bg-background/80 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                              Ejercicio {index + 1}
                            </p>
                            <h5 className="mt-1 text-lg font-semibold">{exercise.name}</h5>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{exercise.sets} series</Badge>
                            <Badge variant="outline">{exercise.reps} reps</Badge>
                            <Badge variant="outline">{exercise.rest} descanso</Badge>
                          </div>
                        </div>
                        {exercise.instructions ? (
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{exercise.instructions}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </SectionShell>
            ) : null}

            {assignment?.mealPlan ? (
              <SectionShell
                title="Plan alimenticio asignado"
                description="Distribución diaria exacta de comidas, alimentos y macronutrientes."
              >
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="text-2xl font-bold">{assignment.mealPlan.name}</h4>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {assignment.mealPlan.description || "Plan nutricional personalizado."}
                      </p>
                    </div>
                    <Badge className="gap-1 bg-accent/10 text-accent hover:bg-accent/10">
                      <Flame className="h-3.5 w-3.5" />
                      {assignment.mealPlan.calories} kcal / día
                    </Badge>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {assignment.mealPlan.meals.map((meal, index) => (
                      <Card key={`${meal.name}-${index}`} className="overflow-hidden rounded-2xl border bg-background/80">
                        <CardHeader className="border-b bg-muted/20 pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-lg">{meal.name}</CardTitle>
                              <CardDescription className="mt-1 flex items-center gap-1">
                                <UtensilsCrossed className="h-3.5 w-3.5" />
                                {meal.time}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary">{meal.calories} kcal</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Alimentos
                            </p>
                            <ul className="space-y-1.5">
                              {meal.foods.map((food, foodIndex) => (
                                <li key={`${food}-${foodIndex}`} className="flex gap-2 text-sm">
                                  <span className="text-accent">•</span>
                                  <span>{food}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {meal.macros ? (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-sky-500/10 p-2 text-center text-xs">
                                <p className="font-semibold text-sky-700 dark:text-sky-400">Proteínas</p>
                                <p className="mt-1 text-base font-bold">{meal.macros.protein}g</p>
                              </div>
                              <div className="rounded-lg bg-amber-500/10 p-2 text-center text-xs">
                                <p className="font-semibold text-amber-700 dark:text-amber-400">Carbos</p>
                                <p className="mt-1 text-base font-bold">{meal.macros.carbs}g</p>
                              </div>
                              <div className="rounded-lg bg-rose-500/10 p-2 text-center text-xs">
                                <p className="font-semibold text-rose-700 dark:text-rose-400">Grasas</p>
                                <p className="mt-1 text-base font-bold">{meal.macros.fats}g</p>
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </SectionShell>
            ) : null}

            {achievements.length > 0 ? (
              <SectionShell title="Logros y constancia" description="Hitos alcanzados durante tu proceso.">
                <div className="grid gap-3 md:grid-cols-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`rounded-2xl border p-4 ${achievement.unlocked ? "bg-primary/5 border-primary/20" : "opacity-70"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${achievement.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{achievement.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                          <Badge variant={achievement.unlocked ? "default" : "secondary"} className="mt-3">
                            {achievement.unlocked ? "Desbloqueado" : "Pendiente"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionShell>
            ) : null}

            <Separator className="print:my-2" />
            <p className="text-center text-xs text-muted-foreground print:text-[10px]">
              Informe generado por GymPro · {formatDate(generatedAt.toISOString())}
            </p>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
