"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Dumbbell, UtensilsCrossed, Moon, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/calendar-data"

interface CalendarViewProps {
  events: CalendarEvent[]
}

const eventTypeConfig = {
  workout: {
    icon: Dumbbell,
    color: "bg-primary/10 text-primary border-primary/20",
    label: "Entrenamiento",
  },
  meal: {
    icon: UtensilsCrossed,
    color: "bg-accent/10 text-accent border-accent/20",
    label: "Alimentación",
  },
  rest: {
    icon: Moon,
    color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    label: "Descanso",
  },
  assessment: {
    icon: ClipboardCheck,
    color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    label: "Evaluación",
  },
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day)
    const today = isToday(day)

    days.push(
      <div
        key={day}
        className={cn(
          "aspect-square border rounded-lg p-2 hover:bg-accent/5 transition-colors",
          today && "border-primary bg-primary/5",
        )}
      >
        <div className="flex flex-col h-full">
          <span className={cn("text-sm font-medium mb-1", today && "text-primary font-bold")}>{day}</span>
          <div className="flex-1 space-y-1 overflow-hidden">
            {dayEvents.slice(0, 2).map((event) => {
              const config = eventTypeConfig[event.type]
              const Icon = config.icon
              return (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded border flex items-center gap-1",
                    config.color,
                    event.completed && "opacity-50 line-through",
                  )}
                >
                  <Icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate text-[10px]">{event.title}</span>
                </div>
              )
            })}
            {dayEvents.length > 2 && (
              <div className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 2} más</div>
            )}
          </div>
        </div>
      </div>,
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendario de Entrenamiento</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center font-semibold">
              {monthNames[month]} {year}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">Leyenda</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(eventTypeConfig).map(([type, config]) => {
              const Icon = config.icon
              return (
                <div key={type} className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
