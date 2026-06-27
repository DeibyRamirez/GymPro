"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CreateExerciseDialog } from "@/components/trainer/create-exercise-dialog"
import { EditExerciseDialog, type SavedExercise } from "@/components/trainer/edit-exercise-dialog"
import {
  DIFFICULTY_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
} from "@/components/trainer/exercise-form-fields"
import { primaryImage } from "@/lib/images/constants"
import { Edit, Plus, Search } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

interface ExercisesLibraryProps {
  trainerId: string
}

function muscleGroupLabel(value: string) {
  return MUSCLE_GROUP_OPTIONS.find((item) => item.value === value)?.label || value
}

function difficultyLabel(value: string) {
  return DIFFICULTY_OPTIONS.find((item) => item.value === value)?.label || value
}

async function fetchExercises(): Promise<SavedExercise[]> {
  const response = await fetch("/api/exercises?limit=100", { credentials: "include" })
  if (!response.ok) throw new Error("Error al obtener ejercicios")

  const data = await response.json()
  return data.exercises || []
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ExercisesLibrary({ trainerId }: ExercisesLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [exercises, setExercises] = useState<SavedExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<SavedExercise | null>(null)

  const refreshExercises = async () => {
    try {
      const nextExercises = await fetchExercises()
      setExercises(nextExercises)
      setError("")
    } catch {
      setError("No se pudieron cargar los ejercicios.")
    }
  }

  useEffect(() => {
    let active = true

    async function loadExercises() {
      try {
        const nextExercises = await fetchExercises()
        if (!active) return
        setExercises(nextExercises)
        setError("")
      } catch {
        if (!active) return
        setError("No se pudieron cargar los ejercicios.")
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadExercises()

    return () => {
      active = false
    }
  }, [])

  const filteredExercises = exercises.filter((exercise) => {
    const query = searchQuery.toLowerCase()
    const muscleText = (exercise.muscleGroups || []).map(muscleGroupLabel).join(" ").toLowerCase()
    return (
      exercise.name?.toLowerCase().includes(query) ||
      exercise.instructions?.toLowerCase().includes(query) ||
      muscleText.includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, músculo o instrucciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo ejercicio
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {filteredExercises.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No hay ejercicios que coincidan con tu búsqueda."
              : "Aún no tienes ejercicios guardados. Crea el primero para reutilizarlo en rutinas."}
          </p>
          {!searchQuery ? (
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear ejercicio
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExercises.map((exercise) => {
            const exerciseId = exercise.id || exercise._id || exercise.name
            const thumb = primaryImage(exercise.images, exercise.image, "/default-exercise.png")

            return (
              <Card key={exerciseId} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <Image
                    src={thumb}
                    alt={exercise.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold leading-tight">{exercise.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(exercise.muscleGroups || []).map((group) => (
                        <Badge key={group} variant="secondary" className="text-xs">
                          {muscleGroupLabel(group)}
                        </Badge>
                      ))}
                      {exercise.difficulty ? (
                        <Badge variant="outline" className="text-xs">
                          {difficultyLabel(exercise.difficulty)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Ref: {exercise.sets} series · {exercise.reps} reps · {exercise.rest} descanso
                  </p>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{exercise.instructions}</p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => {
                      setSelectedExercise(exercise)
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CreateExerciseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshExercises}
      />

      {selectedExercise ? (
        <EditExerciseDialog
          key={selectedExercise.id || selectedExercise._id}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          exercise={selectedExercise}
          onUpdated={refreshExercises}
        />
      ) : null}
    </div>
  )
}
