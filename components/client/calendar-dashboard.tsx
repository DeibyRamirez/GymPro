"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { CalendarEvent } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Loader2, Moon, Sparkles, SunMedium } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

interface CalendarDashboardProps {
  onBack: () => void
  assignmentId?: string
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
  assignmentId?: string
  trainerId?: string
  gymId?: string
  routineId?: string
  source?: CalendarEvent["source"]
  routine?: { id?: string; name?: string; description?: string; exercises?: Array<{ exercise?: { name?: string }; sets?: number; reps?: string; rest?: string; instructions?: string }> } | null
  exercises?: CalendarEvent["exercises"]
  metadata?: Record<string, unknown>
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

function normalizeDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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

export function CalendarDashboard({ onBack, assignmentId }: CalendarDashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(new Date()))
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [saving, setSaving] = useState(false)

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  const selectedDayEvents = useMemo(
    () => events.filter((event) => sameDay(event.date, selectedDate)).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events, selectedDate],
  )

  const selectedDayType = selectedDayEvents[0]?.type

  const goPreviousMonth = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const goNextMonth = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))

  const refreshEvents = useCallback(async () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const requests = [
      fetch(`/api/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, { credentials: "include" }),
    ]

    if (assignmentId) {
      requests.push(fetch(`/api/assignments/${assignmentId}/calendar?month=${startDate.toISOString()}`, { credentials: "include" }))
    }

    const responses = await Promise.all(requests)
    const payloads = await Promise.all(responses.filter((response) => response.ok).map((response) => response.json()))
    const sourceEvents = payloads.flatMap((data) => (data.events || data.calendario || []) as CalendarApiEvent[])
    const formattedEvents = mergeEvents(
      sourceEvents.map((event, index) => ({
        id: event.id || event._id || `${event.date}-${event.title}-${index}`,
        title: event.title,
        description: event.description,
        date: new Date(event.date),
        type: event.type,
        completed: event.completed || false,
        source: event.source,
        routineId: event.routineId,
        assignmentId: event.assignmentId,
        trainerId: event.trainerId,
        gymId: event.gymId,
        exercises: event.exercises,
        metadata: event.metadata,
        capacity: event.capacity,
        bookedCount: event.bookedCount,
      })) as CalendarEvent[],
    )
    setEvents(formattedEvents)
  }, [assignmentId])

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
        <p className="mt-2 text-muted-foreground">Verde entrenamiento, azul descanso y amarillo eventos especiales del trainer.</p>
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
                      <span className={cn("text-sm font-semibold", isSelected && "text-foreground")}>{day}</span>
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
                      </div>

                      {event.type === "class" ? (
                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
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
    </div>
  )
}
