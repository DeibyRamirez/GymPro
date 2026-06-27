"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { GOAL_LABELS, tagsMatchGoal } from "@/lib/assignment/goal-tags"
import { getDocumentId } from "@/lib/assignment/ref-id"
import { toast } from "@/hooks/use-toast"
import { Calendar, Check, Dumbbell, Flame, Settings2, Target, UtensilsCrossed } from "lucide-react"

export type AssignProgramPayload = {
  routineId: string
  mealPlanId?: string
  durationWeeks: number
  weeklySchedule: Array<{
    dayOfWeek: number
    isRestDay: boolean
    title?: string
    routineTemplateId?: string
  }>
}

export type ExistingAssignmentForEdit = {
  _id?: string
  id?: string
  durationWeeks?: number
  routineId?: { _id?: string; id?: string; sourceRoutineId?: string } | string | null
  mealPlanId?: unknown
  weeklySchedule?: Array<{
    dayOfWeek: number
    isRestDay?: boolean
    routineId?: { _id?: string; id?: string; sourceRoutineId?: string } | string | null
  }>
  status?: string
}

interface AssignProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  clientGoal?: string | null
  existingAssignment?: ExistingAssignmentForEdit | null
  onAssign: (payload: AssignProgramPayload) => Promise<void> | void
}

type RoutineOption = {
  _id?: string
  id?: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  exercises: unknown[]
  tags?: string[]
  isTemplate?: boolean
}

type MealPlanOption = {
  _id?: string
  id?: string
  name: string
  description: string
  calories: number
  meals: unknown[]
  tags?: string[]
  isTemplate?: boolean
}

const difficultyLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
} as const

const WEEKDAYS = [
  { day: 0, label: "D", name: "Domingo" },
  { day: 1, label: "L", name: "Lunes" },
  { day: 2, label: "M", name: "Martes" },
  { day: 3, label: "X", name: "Miércoles" },
  { day: 4, label: "J", name: "Jueves" },
  { day: 5, label: "V", name: "Viernes" },
  { day: 6, label: "S", name: "Sábado" },
] as const

function routineOptionId(routine: RoutineOption): string {
  return routine.id || routine._id || ""
}

function resolveTemplateId(
  routineRef?: { _id?: string; id?: string } | string | null,
): string {
  if (!routineRef) return ""
  if (typeof routineRef === "string") return routineRef
  return routineRef.id || routineRef._id || ""
}

function buildFormStateFromAssignment(existingAssignment?: ExistingAssignmentForEdit | null) {
  if (!existingAssignment) {
    return {
      selectedRoutine: "",
      selectedMealPlan: "",
      durationWeeks: "4",
      activeDays: [1, 2, 3, 4, 5] as number[],
      dayRoutines: {} as Record<number, string>,
      advancedPerDay: false,
    }
  }

  const defaultTemplate = resolveTemplateId(existingAssignment.routineId)
  const schedule = existingAssignment.weeklySchedule || []
  const active = schedule.filter((d) => !d.isRestDay).map((d) => d.dayOfWeek)
  const perDay: Record<number, string> = {}

  for (const item of schedule) {
    if (!item.isRestDay) {
      const templateId = resolveTemplateId(item.routineId) || defaultTemplate
      if (templateId) perDay[item.dayOfWeek] = templateId
    }
  }

  const hasDistinctRoutines = new Set(Object.values(perDay)).size > 1

  return {
    selectedRoutine: defaultTemplate,
    selectedMealPlan: "",
    durationWeeks: String(existingAssignment.durationWeeks || 4),
    activeDays: active.length ? active.sort() : [1, 2, 3, 4, 5],
    dayRoutines: perDay,
    advancedPerDay: hasDistinctRoutines,
  }
}

function fillDayRoutinesForActiveDays(
  current: Record<number, string>,
  activeDays: number[],
  routineId: string,
): Record<number, string> {
  if (!routineId) return current
  const next = { ...current }
  for (const day of activeDays) {
    if (!next[day]) next[day] = routineId
  }
  return next
}

interface AssignProgramFormProps {
  clientName: string
  clientGoal?: string | null
  existingAssignment?: ExistingAssignmentForEdit | null
  routines: RoutineOption[]
  mealPlans: MealPlanOption[]
  onOpenChange: (open: boolean) => void
  onAssign: (payload: AssignProgramPayload) => Promise<void> | void
}

function AssignProgramForm({
  clientName,
  clientGoal,
  existingAssignment,
  routines,
  mealPlans,
  onOpenChange,
  onAssign,
}: AssignProgramFormProps) {
  const isEditMode = Boolean(getDocumentId(existingAssignment))
  const initial = buildFormStateFromAssignment(existingAssignment)

  const [selectedRoutine, setSelectedRoutine] = useState(initial.selectedRoutine)
  const [selectedMealPlan, setSelectedMealPlan] = useState(initial.selectedMealPlan)
  const [durationWeeks, setDurationWeeks] = useState(initial.durationWeeks)
  const [activeDays, setActiveDays] = useState<number[]>(initial.activeDays)
  const [filterByGoal, setFilterByGoal] = useState(true)
  const [advancedPerDay, setAdvancedPerDay] = useState(initial.advancedPerDay)
  const [dayRoutines, setDayRoutines] = useState<Record<number, string>>(initial.dayRoutines)

  const handleRoutineChange = (value: string) => {
    setSelectedRoutine(value)
    setDayRoutines((current) => fillDayRoutinesForActiveDays(current, activeDays, value))
  }

  const toggleActiveDay = (day: number) => {
    const isActive = activeDays.includes(day)
    if (isActive) {
      setActiveDays((current) => current.filter((d) => d !== day))
      return
    }

    const nextActiveDays = [...activeDays, day].sort()
    setActiveDays(nextActiveDays)
    if (selectedRoutine) {
      setDayRoutines((current) =>
        fillDayRoutinesForActiveDays(current, [day], selectedRoutine),
      )
    }
  }

  const filteredRoutines = useMemo(
    () =>
      filterByGoal && clientGoal
        ? routines.filter((routine) => tagsMatchGoal(routine.tags, clientGoal))
        : routines,
    [routines, filterByGoal, clientGoal],
  )

  const filteredMealPlans = useMemo(
    () =>
      filterByGoal && clientGoal
        ? mealPlans.filter((plan) => tagsMatchGoal(plan.tags, clientGoal))
        : mealPlans,
    [mealPlans, filterByGoal, clientGoal],
  )

  const visibleMealPlans = filteredMealPlans
    .map((plan) => ({ ...plan, mealPlanId: plan.id || plan._id }))
    .filter((plan) => Boolean(plan.mealPlanId)) as Array<MealPlanOption & { mealPlanId: string }>

  const handleAssign = async () => {
    if (!selectedRoutine && !Object.values(dayRoutines).some(Boolean)) return

    const weeklySchedule = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
      const isRestDay = !activeDays.includes(dayOfWeek)
      const routineTemplateId = isRestDay ? undefined : dayRoutines[dayOfWeek] || selectedRoutine
      return {
        dayOfWeek,
        isRestDay,
        title: isRestDay ? "Descanso Activo" : "Entrenamiento",
        routineTemplateId: routineTemplateId || undefined,
      }
    })

    try {
      await Promise.resolve(
        onAssign({
          routineId: selectedRoutine || Object.values(dayRoutines)[0] || "",
          mealPlanId: selectedMealPlan || undefined,
          durationWeeks: Number(durationWeeks) || 4,
          weeklySchedule,
        }),
      )
      onOpenChange(false)
      if (!isEditMode) {
        setSelectedRoutine("")
        setSelectedMealPlan("")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo asignar el programa"
      toast({ title: isEditMode ? "Error al actualizar" : "Error al asignar", description: message, variant: "destructive" })
    }
  }

  const goalLabel = clientGoal ? GOAL_LABELS[clientGoal] || clientGoal : null
  const canSubmit = Boolean(selectedRoutine || Object.values(dayRoutines).some(Boolean))

  return (
    <>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Actualizar programa de ${clientName}` : `Asignar programa a ${clientName}`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifica rutina, plan o calendario sin crear una asignación duplicada."
              : "Rutina y plan alimenticio en un solo paso, según la meta del cliente."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
          {goalLabel ? (
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              Meta: {goalLabel}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Sin meta registrada en el perfil</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Switch id="filter-goal" checked={filterByGoal} onCheckedChange={setFilterByGoal} />
            <Label htmlFor="filter-goal" className="text-sm font-normal cursor-pointer">
              Sugeridos para su meta
            </Label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Rutina de entrenamiento</h4>
            <Badge variant="secondary">{advancedPerDay ? "Por día" : "Predeterminada"}</Badge>
          </div>
          <RadioGroup value={selectedRoutine} onValueChange={handleRoutineChange} className="space-y-2">
            {filteredRoutines.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
                No hay rutinas que coincidan. Desactiva el filtro por meta o agrega tags a tus plantillas.
              </p>
            ) : (
              filteredRoutines.map((routine) => {
                const rid = routineOptionId(routine)
                return (
                <div
                  key={rid}
                  className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/5 cursor-pointer"
                >
                  <RadioGroupItem value={rid} id={`routine-${rid}`} className="mt-1" />
                  <Label htmlFor={`routine-${rid}`} className="flex-1 cursor-pointer space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{routine.name}</span>
                      <Badge variant="secondary">{difficultyLabels[routine.difficulty]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{routine.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {routine.exercises.length} ejercicios · {routine.duration}
                    </p>
                  </Label>
                </div>
              )})
            )}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-accent" />
            <h4 className="font-semibold">Plan alimenticio</h4>
            <Badge variant="outline">Opcional</Badge>
          </div>
          <RadioGroup
            value={selectedMealPlan || "none"}
            onValueChange={(value) => setSelectedMealPlan(value === "none" ? "" : value)}
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="none" id="meal-none" className="mt-1" />
              <Label htmlFor="meal-none" className="cursor-pointer text-sm">
                {isEditMode ? "Mantener plan actual (sin cambiar)" : "Sin plan alimenticio por ahora"}
              </Label>
            </div>
            {visibleMealPlans.map((plan) => (
              <div
                key={plan.mealPlanId}
                className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/5 cursor-pointer"
              >
                <RadioGroupItem value={plan.mealPlanId} id={`meal-${plan.mealPlanId}`} className="mt-1" />
                <Label htmlFor={`meal-${plan.mealPlanId}`} className="flex-1 cursor-pointer space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.name}</span>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      <Flame className="mr-1 h-3 w-3" />
                      {plan.calories} kcal
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <p className="text-xs text-muted-foreground">{plan.meals.length} comidas diarias</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base">Calendario semanal</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch id="advanced-per-day" checked={advancedPerDay} onCheckedChange={setAdvancedPerDay} />
                <Label htmlFor="advanced-per-day" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                  <Settings2 className="h-3 w-3" />
                  Rutina por día
                </Label>
              </div>
              <Badge variant="secondary">Microciclo</Badge>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Duración (semanas)</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
              >
                <option value="4">4 semanas</option>
                <option value="6">6 semanas</option>
                <option value="8">8 semanas</option>
                <option value="12">12 semanas</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Días de entrenamiento</Label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map(({ day, label }) => {
                  const active = activeDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`flex h-10 items-center justify-center rounded-md border text-sm ${active ? "bg-primary text-primary-foreground" : "bg-background"}`}
                      onClick={() => toggleActiveDay(day)}
                    >
                      {active && <Check className="mr-1 h-3 w-3" />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {advancedPerDay && activeDays.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-sm">Rutina por día de entrenamiento</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {WEEKDAYS.filter(({ day }) => activeDays.includes(day)).map(({ day, name }) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{name}</Label>
                    <select
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                      value={dayRoutines[day] || selectedRoutine}
                      onChange={(e) =>
                        setDayRoutines((current) => ({ ...current, [day]: e.target.value }))
                      }
                    >
                      {filteredRoutines.map((routine) => {
                        const rid = routineOptionId(routine)
                        return (
                        <option key={rid} value={rid}>
                          {routine.name}
                        </option>
                      )})}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            El plan alimenticio se aplica a todos los días; la rutina solo en días activos.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!canSubmit}>
            {isEditMode ? "Actualizar programa" : "Asignar programa"}
          </Button>
        </DialogFooter>
    </>
  )
}

export function AssignProgramDialog({
  open,
  onOpenChange,
  clientName,
  clientGoal,
  existingAssignment,
  onAssign,
}: AssignProgramDialogProps) {
  const [routines, setRoutines] = useState<RoutineOption[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlanOption[]>([])

  useEffect(() => {
    if (!open) return

    let active = true

    const load = async () => {
      try {
        const [routinesRes, mealPlansRes] = await Promise.all([
          fetch("/api/routines?limit=100&templatesOnly=true", { credentials: "include" }),
          fetch("/api/meal-plans?limit=100&templatesOnly=true", { credentials: "include" }),
        ])

        const routinesData = await routinesRes.json().catch(() => null)
        const mealPlansData = await mealPlansRes.json().catch(() => null)

        if (!routinesRes.ok) {
          throw new Error(routinesData?.error || "No se pudieron cargar las rutinas")
        }
        if (!mealPlansRes.ok) {
          throw new Error(mealPlansData?.error || "No se pudieron cargar los planes")
        }

        if (active) {
          const templateRoutines = (routinesData?.routines || []).filter(
            (routine: RoutineOption) => routine.isTemplate !== false,
          )
          const templateMealPlans = (mealPlansData?.mealPlans || []).filter(
            (plan: MealPlanOption) => plan.isTemplate !== false,
          )
          setRoutines(templateRoutines)
          setMealPlans(templateMealPlans)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar el catálogo"
        toast({ title: "Error", description: message, variant: "destructive" })
        if (active) {
          setRoutines([])
          setMealPlans([])
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [open])

  const formKey = `${getDocumentId(existingAssignment) || "new"}-${clientName}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {open ? (
          <AssignProgramForm
            key={formKey}
            clientName={clientName}
            clientGoal={clientGoal}
            existingAssignment={existingAssignment}
            routines={routines}
            mealPlans={mealPlans}
            onOpenChange={onOpenChange}
            onAssign={onAssign}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
