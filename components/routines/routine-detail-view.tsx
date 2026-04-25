"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExerciseCard } from "./exercise-card"
import { ArrowLeft, Clock, TrendingUp, CheckCircle2 } from "lucide-react"
import type { Routine } from "@/lib/data"

type AssignedRoutine = Routine & {
  assignmentId?: string
  exercises: Array<{
    _id?: string
    exercise: {
      _id: string
      name: string
      image?: string
      instructions?: string
    }
    sets: number
    reps: string
    rest: string
    instructions: string
  }>
}

interface RoutineDetailViewProps {
  routine: AssignedRoutine
  onBack: () => void
}

const difficultyColors = {
  beginner: "bg-primary/10 text-primary",
  intermediate: "bg-accent/10 text-accent",
  advanced: "bg-destructive/10 text-destructive",
}

const difficultyLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export function RoutineDetailView({ routine, onBack }: RoutineDetailViewProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const markSetCompleted = async (exerciseId: string, setNumber: number) => {
    if (!routine.assignmentId) return

    const key = `${exerciseId}-${setNumber}`
    if (completed[key]) return

    const response = await fetch(`/api/assignments/${routine.assignmentId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        routineId: routine.id,
        exerciseId,
        setNumber,
      }),
    })

    if (response.ok) {
      setCompleted((current) => ({ ...current, [key]: true }))
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">{routine.name}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{routine.description}</p>
          </div>
          <Badge variant="secondary" className={`${difficultyColors[routine.difficulty]} text-sm px-3 py-1`}>
            {difficultyLabels[routine.difficulty]}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">{routine.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">{routine.exercises.length} ejercicios</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Ejercicios</h3>
        <div className="grid gap-6 md:grid-cols-2">
          {routine.exercises.map((exercise, index) => (
            <div key={exercise._id || exercise.exercise._id} className="space-y-3">
                <ExerciseCard
                  exercise={{
                    id: exercise.exercise._id,
                  name: exercise.exercise.name,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  rest: exercise.rest,
                  image: exercise.exercise.image || "/placeholder.svg",
                  instructions: exercise.instructions || exercise.exercise.instructions || "",
                }}
                index={index}
              />
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Series</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: exercise.sets }).map((_, i) => {
                    const setNumber = i + 1
                    const key = `${exercise.exercise._id}-${setNumber}`
                    const isDone = completed[key]
                    return (
                      <Button
                        key={key}
                        type="button"
                        size="sm"
                        variant={isDone ? "default" : "outline"}
                        onClick={() => markSetCompleted(exercise.exercise._id, setNumber)}
                        disabled={isDone || !routine.assignmentId}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Serie {setNumber}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="bg-muted/50 rounded-lg p-6 space-y-3">
          <h4 className="font-semibold text-lg">Consejos Importantes</h4>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Realiza un calentamiento de 5-10 minutos antes de comenzar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Mantén una técnica correcta en todo momento, la calidad es más importante que la cantidad</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Respeta los tiempos de descanso entre series</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Hidrátate adecuadamente durante el entrenamiento</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Si sientes dolor (no confundir con fatiga muscular), detente y consulta con tu entrenador</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
