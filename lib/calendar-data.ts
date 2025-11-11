export interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "workout" | "meal" | "rest" | "assessment"
  completed: boolean
  description?: string
}

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Entrenamiento de Fuerza",
    date: new Date(2025, 0, 6), // Enero 6, 2025
    type: "workout",
    completed: true,
    description: "Rutina de fuerza total",
  },
  {
    id: "e2",
    title: "Plan Alimenticio",
    date: new Date(2025, 0, 6),
    type: "meal",
    completed: true,
    description: "Seguir plan de definición",
  },
  {
    id: "e3",
    title: "Entrenamiento HIIT",
    date: new Date(2025, 0, 8),
    type: "workout",
    completed: false,
    description: "Cardio de alta intensidad",
  },
  {
    id: "e4",
    title: "Día de Descanso",
    date: new Date(2025, 0, 9),
    type: "rest",
    completed: false,
    description: "Recuperación activa",
  },
  {
    id: "e5",
    title: "Entrenamiento de Fuerza",
    date: new Date(2025, 0, 10),
    type: "workout",
    completed: false,
    description: "Rutina de fuerza total",
  },
  {
    id: "e6",
    title: "Evaluación Mensual",
    date: new Date(2025, 0, 15),
    type: "assessment",
    completed: false,
    description: "Mediciones y progreso",
  },
  {
    id: "e7",
    title: "Entrenamiento HIIT",
    date: new Date(2025, 0, 13),
    type: "workout",
    completed: false,
    description: "Cardio de alta intensidad",
  },
]
