import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, UtensilsCrossed, Moon, ClipboardCheck, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/calendar-data"

interface UpcomingEventsProps {
  events: CalendarEvent[]
  onToggleComplete?: (eventId: string, completed: boolean) => void
  onDelete?: (eventId: string) => void
}

const eventTypeConfig = {
  workout: {
    icon: Dumbbell,
    color: "bg-primary/10 text-primary",
    label: "Entrenamiento",
  },
  meal: {
    icon: UtensilsCrossed,
    color: "bg-accent/10 text-accent",
    label: "Alimentación",
  },
  rest: {
    icon: Moon,
    color: "bg-chart-3/10 text-chart-3",
    label: "Descanso",
  },
  assessment: {
    icon: ClipboardCheck,
    color: "bg-chart-4/10 text-chart-4",
    label: "Evaluación",
  },
}

export function UpcomingEvents({ events, onToggleComplete, onDelete }: UpcomingEventsProps) {
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5)

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Mañana"
    } else {
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const config = eventTypeConfig[event.type]
            const Icon = config.icon

            return (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  event.completed ? "bg-muted/50 opacity-60" : "bg-card",
                )}
              >
                <div className={cn("p-2 rounded-lg", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className={cn("font-medium text-sm", event.completed && "line-through")}>{event.title}</h4>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                    </div>
                    {event.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(event.date)}
                    </Badge>
                    <Badge variant="secondary" className={cn("text-xs", config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => onToggleComplete?.(event.id, !event.completed)}>
                      {event.completed ? 'Marcar pendiente' : 'Completar'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete?.(event.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
