"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarView } from "@/components/calendar/calendar-view"
import { UpcomingEvents } from "@/components/calendar/upcoming-events"
import { ArrowLeft, Loader2 } from "lucide-react"

interface CalendarDashboardProps {
  onBack: () => void
  assignmentId?: string
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  type: 'workout' | 'meal' | 'rest' | 'assessment' | 'class'
  completed?: boolean
  capacity?: number
  bookedCount?: number
  attendanceCode?: string
}

type CalendarApiEvent = {
  id?: string
  _id?: string
  title: string
  description?: string
  date: string
  type: CalendarEvent['type']
  completed?: boolean
  capacity?: number
  bookedCount?: number
  attendanceCode?: string
}

export function CalendarDashboard({ onBack, assignmentId }: CalendarDashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [type, setType] = useState<CalendarEvent['type']>('workout')
  const [saving, setSaving] = useState(false)
  const [capacity, setCapacity] = useState("10")

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Cargar eventos del mes actual y próximo
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        
        const response = assignmentId
          ? await fetch(`/api/assignments/${assignmentId}/calendar?month=${startDate.toISOString()}`, { credentials: 'include' })
          : await fetch(`/api/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, { credentials: "include" })
        
        if (response.ok) {
          const data = await response.json()
          const sourceEvents = (data.events || data.calendario || []) as CalendarApiEvent[]
          const formattedEvents = sourceEvents.map((event) => ({
            id: event.id || event._id,
            title: event.title,
            description: event.description,
            date: event.date,
            type: event.type,
            completed: event.completed || false,
            capacity: event.capacity,
            bookedCount: event.bookedCount,
            attendanceCode: event.attendanceCode,
          })) || []
          setEvents(formattedEvents)
        }
      } catch (error) {
        console.error("Error cargando eventos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [assignmentId])

  const refreshEvents = async () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const response = await fetch(
      assignmentId ? `/api/assignments/${assignmentId}/calendar?month=${startDate.toISOString()}` : `/api/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      { credentials: "include" }
    )
    if (response.ok) {
      const data = await response.json()
      const sourceEvents = (data.events || data.calendario || []) as CalendarApiEvent[]
      const formattedEvents = sourceEvents.map((event) => ({
        id: event.id || event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        type: event.type,
        completed: event.completed || false,
        capacity: event.capacity,
        bookedCount: event.bookedCount,
        attendanceCode: event.attendanceCode,
      })) || []
      setEvents(formattedEvents)
    }
  }

  const updateEventStatus = async (eventId: string, completed: boolean) => {
    await fetch(`/api/calendar/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ completed }),
    })
    await refreshEvents()
  }

  const deleteEvent = async (eventId: string) => {
    await fetch(`/api/calendar/${eventId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await refreshEvents()
  }

  const handleCreateEvent = async () => {
    if (!title || !date) return

    setSaving(true)
    try {
      // El trainer crea la clase y el cliente la verá en su calendario.
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
          body: JSON.stringify({
            title,
            description,
            date,
            type,
            capacity: type === 'class' ? Number(capacity) : undefined,
          }),
      })
      setCreateOpen(false)
      setTitle('')
      setDescription('')
      setDate('')
      setType('workout')
      await refreshEvents()
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
        <div className="flex items-center justify-center min-h-[400px]">
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
        <p className="text-muted-foreground mt-2">Planifica y sigue tu progreso de entrenamiento y nutrición</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Nuevo evento</Button>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <p className="font-medium">Clases grupales</p>
        <p className="text-sm text-muted-foreground">Las clases creadas por el trainer se reflejan en este calendario para los clientes asignados.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarView events={events} />
        </div>
        <div>
          <UpcomingEvents events={events} onToggleComplete={updateEventStatus} onDelete={deleteEvent} />
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear evento</DialogTitle>
            <DialogDescription>Agrega un evento de entrenamiento, comida o evaluación al calendario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(value: CalendarEvent['type']) => setType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="workout">Entrenamiento</SelectItem>
                  <SelectItem value="meal">Comida</SelectItem>
                  <SelectItem value="rest">Descanso</SelectItem>
                  <SelectItem value="assessment">Evaluación</SelectItem>
                  <SelectItem value="class">Clase grupal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === 'class' && (
              <>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">La clase aparecerá en el calendario de los clientes asignados por el trainer.</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateEvent} disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
