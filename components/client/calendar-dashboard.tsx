"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { CalendarEvent } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Flame, Loader2, Moon, Pencil, Sparkles, SunMedium, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

interface CalendarDashboardProps {
  onBack: () => void
  assignmentId?: string
  onOpenWorkout?: (dateKey: string, routineId?: string) => void
}

type CalendarApiEvent = {
  id?: string
  _id?: string
  title: string
  description?: string
  date: string
  type: CalendarEvent["type"]
  completed?: boolean
  capacity?: number
  bookedCount?: number
  attendanceCode?: string
  invitationStatus?: "none" | "pending" | "confirmed" | "declined"
  canEdit?: boolean
  canRespond?: boolean
  invitedUserIds?: string[]
  assignmentId?: string
  trainerId?: string
  gymId?: string
  routineId?: string
  source?: CalendarEvent["source"]
  routine?: { id?: string; name?: string; description?: string; exercises?: Array<{ exercise?: { name?: string }; sets?: number; reps?: string; rest?: string; instructions?: string }> } | null
  exercises?: Array<{
    exerciseId?: string
    name: string
    sets?: number
    reps?: string
    rest?: string
    instructions?: string
  }>
  mealsToday?: Array<{
    name: string
    time: string
    foods: string[]
    calories: number
  }>
  metadata?: Record<string, unknown>
  isRestDay?: boolean
  hasMealPlan?: boolean
  dayCompletion?: CalendarEvent["dayCompletion"]
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const typeMeta: Record<CalendarEvent["type"], { label: string; className: string; icon: typeof Dumbbell }> = {
  workout: { label: "Entrenamiento", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: Dumbbell },
  rest: { label: "Descanso", className: "bg-blue-500/15 text-blue-700 border-blue-500/30", icon: Moon },
  assessment: { label: "Evaluación", className: "bg-amber-400/20 text-amber-800 border-amber-500/30", icon: Sparkles },
  appointment: { label: "Evento privado", className: "bg-violet-500/15 text-violet-700 border-violet-500/30", icon: CalendarDays },
  meal: { label: "Comida", className: "bg-orange-500/15 text-orange-700 border-orange-500/30", icon: SunMedium },
  class: { label: "Evento especial", className: "bg-yellow-400/20 text-yellow-900 border-yellow-500/30", icon: CalendarDays },
}

const fallbackTypeMeta = { label: "Evento", className: "bg-muted text-muted-foreground border-border", icon: CalendarDays }

function shouldShowRsvp(event: CalendarEvent): boolean {
  if (event.type !== "class") return false
  if (event.invitationStatus === "confirmed" || event.invitationStatus === "declined") return false
  if (event.invitationStatus === "none") return false
  return event.canRespond !== false
}

function normalizeDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function mergeEvents(events: CalendarEvent[]) {
  const unique = new Map<string, CalendarEvent>()

  for (const event of events) {
    const key = `${event.id}-${event.date.toISOString()}`
    if (!unique.has(key)) {
      unique.set(key, event)
    }
  }

  return Array.from(unique.values())
}

export function CalendarDashboard({ onBack, assignmentId, onOpenWorkout }: CalendarDashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(new Date()))
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [completingDay, setCompletingDay] = useState(false)
  const [streak, setStreak] = useState({ current: 0, longest: 0 })

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  const selectedDayEvents = useMemo(
    () => events.filter((event) => sameDay(event.date, selectedDate)).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events, selectedDate],
  )

  const selectedDayType = selectedDayEvents[0]?.type

  const selectedAssignmentEvent = useMemo(
    () =>
      selectedDayEvents.find(
        (event) => event.source === "assignment" && event.assignmentId === assignmentId,
      ) || null,
    [selectedDayEvents, assignmentId],
  )

  const goPreviousMonth = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const goNextMonth = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))

  const refreshEvents = useCallback(async () => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 2, 0)
    const requests = [
      fetch(`/api/calendar?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`, { credentials: "include" }),
    ]

    if (assignmentId) {
      requests.push(
        fetch(`/api/assignments/${assignmentId}/calendar?month=${monthStart.toISOString()}`, { credentials: "include" }),
      )
    }

    const responses = await Promise.all(requests)
    const payloads = await Promise.all(responses.filter((response) => response.ok).map((response) => response.json()))

    const assignmentPayload = payloads.find((data) => data.streak || data.calendario)
    if (assignmentPayload?.streak) {
      setStreak(assignmentPayload.streak)
    }

    const sourceEvents = payloads.flatMap((data) => (data.events || data.calendario || []) as CalendarApiEvent[])
    const formattedEvents = mergeEvents(
      sourceEvents.map((event, index) => ({
        id: event.id || event._id || `${event.date}-${event.title}-${index}`,
        title: event.title,
        description: event.description,
        date: new Date(`${String(event.date).slice(0, 10)}T12:00:00`),
        type: event.type,
        completed: event.completed || event.dayCompletion?.dayCompleted || false,
        source: event.source,
        routineId: event.routineId,
        assignmentId: event.assignmentId,
        trainerId: event.trainerId,
        gymId: event.gymId,
        exercises: event.exercises,
        metadata: event.metadata,
        capacity: event.capacity,
        bookedCount: event.bookedCount,
        invitationStatus: event.invitationStatus,
        canEdit: event.canEdit,
        canRespond: event.canRespond,
        invitedUserIds: event.invitedUserIds,
        isRestDay: event.isRestDay,
        hasMealPlan: event.hasMealPlan,
        mealsToday: event.mealsToday,
        dayCompletion: event.dayCompletion || null,
      })) as CalendarEvent[],
    )
    setEvents(formattedEvents)
  }, [assignmentId, month])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDate("")
    setEditingEvent(null)
  }

  const handleRespond = async (eventId: string, action: "accept" | "decline") => {
    setRespondingId(eventId)
    try {
      const response = await fetch(`/api/calendar/${eventId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      })
      if (response.ok) await refreshEvents()
    } finally {
      setRespondingId(null)
    }
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setDescription(event.description || "")
    setDate(new Date(event.date).toISOString().slice(0, 16))
    setEditOpen(true)
  }

  const handleEditEvent = async () => {
    if (!editingEvent || !title || !date) return
    setSaving(true)
    try {
      const response = await fetch(`/api/calendar/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          date: new Date(date).toISOString(),
        }),
      })
      if (response.ok) {
        setEditOpen(false)
        resetForm()
        await refreshEvents()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Eliminar este evento?")) return
    const response = await fetch(`/api/calendar/${eventId}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (response.ok) await refreshEvents()
  }

  const updateDayCompletion = async (payload: {
    workoutCompleted?: boolean
    nutritionCompleted?: boolean
    markDayComplete?: boolean
  }) => {
    if (!assignmentId) return
    setCompletingDay(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/day-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: toDateKey(selectedDate),
          ...payload,
        }),
      })
      if (response.ok) await refreshEvents()
    } finally {
      setCompletingDay(false)
    }
  }

  useEffect(() => {
    const loadEvents = async () => {
      try {
        await refreshEvents()
      } catch (error) {
        console.error("Error cargando calendario:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [refreshEvents])

  const handleCreateEvent = async () => {
    if (!title || !date) return
    setSaving(true)
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          date: new Date(date).toISOString(),
          type: 'appointment',
          source: 'manual',
        }),
      })

      if (response.ok) {
        setCreateOpen(false)
        setTitle("")
        setDescription("")
        setDate("")
        await refreshEvents()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-balance">Mi Calendario</h2>
        <p className="mt-2 text-muted-foreground">Marca cada día completado y mantén tu racha de entrenamiento.</p>
        {assignmentId && streak.current > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-200">
            <Flame className="h-4 w-4" />
            Racha: {streak.current} día{streak.current === 1 ? "" : "s"}
            {streak.longest > streak.current && (
              <span className="text-xs font-normal text-muted-foreground">· Mejor: {streak.longest}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Crear evento privado</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Calendario mensual</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[160px] text-center font-semibold">
                  {monthNames[month.getMonth()]} {month.getFullYear()}
                </div>
                <Button variant="outline" size="icon" onClick={goNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">{day}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const currentDate = new Date(month.getFullYear(), month.getMonth(), day)
                const dayEvents = events.filter((event) => sameDay(event.date, currentDate))
                const hasWorkout = dayEvents.some((event) => event.type === "workout")
                const hasRest = dayEvents.some((event) => event.type === "rest")
                const hasClass = dayEvents.some((event) => event.type === "class")
                const hasAppointment = dayEvents.some((event) => event.type === "appointment")
                const assignmentDayDone = dayEvents.some(
                  (event) => event.source === "assignment" && event.completed,
                )
                const isSelected = sameDay(currentDate, selectedDate)
                const isToday = sameDay(currentDate, new Date())
                const tone = hasClass ? typeMeta.class.className : hasAppointment ? typeMeta.appointment.className : hasWorkout ? typeMeta.workout.className : hasRest ? typeMeta.rest.className : "bg-muted/40 text-muted-foreground border-border"

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(currentDate)}
                    className={cn(
                      "aspect-square rounded-xl border p-2 text-left transition-all hover:shadow-sm",
                      tone,
                      isSelected && "ring-2 ring-primary ring-offset-2",
                      isToday && "border-primary",
                    )}
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-sm font-semibold", isSelected && "text-foreground")}>{day}</span>
                        {assignmentDayDone && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Día completado" />
                        )}
                      </div>
                      <div className="mt-1 flex-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => {
                          const config = typeMeta[event.type] || fallbackTypeMeta
                          const Icon = config.icon
                          return (
                            <div key={event.id} className="flex items-center gap-1 rounded-md border border-white/20 bg-white/60 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
                              <Icon className="h-3 w-3" />
                              <span className="truncate">{event.title}</span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && <div className="px-1 text-[10px] text-current/70">+{dayEvents.length - 2} más</div>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <Separator className="my-4" />

            <div className="grid gap-2 text-sm sm:grid-cols-3">
              {([
                { type: "workout", label: "Entrenamiento" },
                { type: "rest", label: "Descanso" },
                { type: "class", label: "Evento especial" },
              ] as const).map((item) => {
                const meta = typeMeta[item.type]
                const Icon = meta.icon
                return (
                  <div key={item.type} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Badge variant="outline" className={cn("h-7 px-2", meta.className)}>
                      <Icon className="mr-1 h-3 w-3" />
                      {item.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Fecha seleccionada</p>
              <p className="mt-1 text-lg font-semibold">{selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No hay eventos para este día.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => {
                  const meta = typeMeta[event.type] || fallbackTypeMeta
                  const Icon = meta.icon
                  return (
                    <div key={event.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("border", meta.className)}>
                              <Icon className="mr-1 h-3 w-3" />
                              {meta.label}
                            </Badge>
                            {event.completed && <Badge variant="secondary">Completado</Badge>}
                          </div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">Tipo: {meta.label} · Título: {event.title}</p>
                          {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                        </div>
                        {event.canEdit && event.type === "appointment" && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditDialog(event)}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </Button>
                          </div>
                        )}
                      </div>

                      {event.type === "class" ? (
                        <div className="mt-4 space-y-3">
                          <div className="grid gap-2 text-sm sm:grid-cols-3">
                            <div className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Día</p>
                              <p className="font-medium">{event.date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Hora</p>
                              <p className="font-medium">{event.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Cupos</p>
                              <p className="font-medium">{event.bookedCount || 0}/{event.capacity || 0}</p>
                            </div>
                          </div>
                          {shouldShowRsvp(event) && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                              <p className="text-sm font-medium">¿Asistirás a este evento?</p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="min-w-[140px]"
                                  disabled={respondingId === event.id}
                                  onClick={() => handleRespond(event.id, "accept")}
                                >
                                  {respondingId === event.id ? "Confirmando..." : "Confirmar asistencia"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={respondingId === event.id}
                                  onClick={() => handleRespond(event.id, "decline")}
                                >
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          )}
                          {event.invitationStatus === "confirmed" && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600">Asistencia confirmada</Badge>
                          )}
                          {event.invitationStatus === "declined" && (
                            <Badge variant="outline">Invitación rechazada</Badge>
                          )}
                        </div>
                      ) : event.type === "workout" && event.exercises?.length ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium">Ejercicios programados</p>
                          {event.exercises.map((exercise, index) => (
                            <div key={`${event.id}-ex-${index}`} className="rounded-lg bg-muted/40 p-3 text-sm">
                              <p className="font-medium">{exercise.name}</p>
                              <p className="text-muted-foreground">{[exercise.sets ? `${exercise.sets} series` : null, exercise.reps, exercise.rest ? `Descanso ${exercise.rest}` : null].filter(Boolean).join(" · ")}</p>
                              {exercise.instructions && <p className="mt-1 text-muted-foreground">{exercise.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}

            {assignmentId && selectedAssignmentEvent && (
              <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Tu programa del día</p>
                  {selectedAssignmentEvent.completed && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completado
                    </Badge>
                  )}
                </div>

                {selectedAssignmentEvent.isRestDay ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rest-done"
                      checked={selectedAssignmentEvent.dayCompletion?.workoutCompleted ?? false}
                      disabled={completingDay}
                      onCheckedChange={(checked) =>
                        void updateDayCompletion({ workoutCompleted: checked === true })
                      }
                    />
                    <Label htmlFor="rest-done" className="text-sm font-normal cursor-pointer">
                      Descanso activo completado
                    </Label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="workout-done"
                        checked={selectedAssignmentEvent.dayCompletion?.workoutCompleted ?? false}
                        disabled={completingDay}
                        onCheckedChange={(checked) =>
                          void updateDayCompletion({ workoutCompleted: checked === true })
                        }
                      />
                      <Label htmlFor="workout-done" className="text-sm font-normal cursor-pointer">
                        Entrenamiento completado
                      </Label>
                    </div>
                    {selectedAssignmentEvent.hasMealPlan && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="nutrition-done"
                          checked={selectedAssignmentEvent.dayCompletion?.nutritionCompleted ?? false}
                          disabled={completingDay}
                          onCheckedChange={(checked) =>
                            void updateDayCompletion({ nutritionCompleted: checked === true })
                          }
                        />
                        <Label htmlFor="nutrition-done" className="text-sm font-normal cursor-pointer">
                          Nutrición del día completada
                        </Label>
                      </div>
                    )}
                  </div>
                )}

                {!selectedAssignmentEvent.completed && (
                  <Button
                    className="w-full"
                    disabled={completingDay}
                    onClick={() => void updateDayCompletion({ markDayComplete: true })}
                  >
                    {completingDay ? "Guardando..." : "Marcar día completado"}
                  </Button>
                )}

                {selectedAssignmentEvent.mealsToday && selectedAssignmentEvent.mealsToday.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <SunMedium className="h-4 w-4 text-orange-600" />
                      Comidas de hoy
                    </p>
                    {selectedAssignmentEvent.mealsToday.map((meal, index) => (
                      <div key={`${meal.name}-${index}`} className="rounded-lg bg-muted/40 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{meal.name}</span>
                          <span className="text-xs text-muted-foreground">{meal.time}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{meal.foods.join(", ")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{meal.calories} kcal</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* {!selectedAssignmentEvent.isRestDay &&
                  onOpenWorkout &&
                  selectedAssignmentEvent.exercises &&
                  selectedAssignmentEvent.exercises.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        onOpenWorkout(
                          toDateKey(selectedDate),
                          selectedAssignmentEvent.routineId
                          || (selectedAssignmentEvent.metadata?.routineId as string | undefined),
                        )
                      }
                    >
                      <Dumbbell className="mr-2 h-4 w-4" />
                      Ir a rutina del día
                    </Button>
                  )} */}
              </div>
            )}

            <Separator />

            <div className="text-sm text-muted-foreground">
              {selectedDayType === "workout" && "Día de entrenamiento activo."}
              {selectedDayType === "rest" && "Día de descanso programado."}
              {selectedDayType === "class" && "Clase grupal del gimnasio."}
              {!selectedDayType && "Selecciona un día para ver el detalle."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear evento privado</DialogTitle>
            <DialogDescription>Solo tú podrás verlo en tu calendario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Título</p>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Descripción</p>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha y hora</p>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateEvent} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Modifica los datos del evento seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Título</p>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Descripción</p>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Fecha y hora</p>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditEvent} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
