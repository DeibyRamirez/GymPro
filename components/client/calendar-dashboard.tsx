"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarView } from "@/components/calendar/calendar-view"
import { UpcomingEvents } from "@/components/calendar/upcoming-events"
import { ArrowLeft, Loader2 } from "lucide-react"

interface CalendarDashboardProps {
  onBack: () => void
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  type: 'workout' | 'meal' | 'rest' | 'assessment'
  completed?: boolean
}

export function CalendarDashboard({ onBack }: CalendarDashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Cargar eventos del mes actual y próximo
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        
        const response = await fetch(
          `/api/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        )
        
        if (response.ok) {
          const data = await response.json()
          const formattedEvents = data.events?.map((event: any) => ({
            id: event.id || event._id,
            title: event.title,
            description: event.description,
            date: event.date,
            type: event.type,
            completed: event.completed || false
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
  }, [])

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarView events={events} />
        </div>
        <div>
          <UpcomingEvents events={events} />
        </div>
      </div>
    </div>
  )
}
