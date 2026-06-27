"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { CloudinaryImageUpload } from "@/components/ui/cloudinary-image-upload"
import { SavedExerciseSelect } from "@/components/trainer/saved-exercise-select"
import { Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Routine, Exercise } from "@/lib/data"
import { getDocumentId } from "@/lib/assignment/ref-id"

interface EditRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine: Routine & { id?: string; trainingDaysPerWeek?: number }
  onUpdated?: () => void
}

interface ExerciseForm extends Exercise {
  sets: number
  reps: string
  rest: string
  instructions: string
  images: string[]
  exerciseRefId?: string
}

function resolveExerciseRefId(entry: {
  exercise?: string | { _id?: string; id?: string }
  _id?: string
  id?: string
}, nested?: { _id?: string; id?: string }) {
  if (nested?._id) return String(nested._id)
  if (nested?.id) return String(nested.id)
  if (typeof entry.exercise === "string") return entry.exercise
  if (entry.exercise && typeof entry.exercise === "object") {
    if (entry.exercise._id) return String(entry.exercise._id)
    if (entry.exercise.id) return String(entry.exercise.id)
  }
  return undefined
}

function normalizeExercisesForForm(raw: unknown): ExerciseForm[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item, index) => {
    const entry = item as {
      _id?: string
      id?: string
      name?: string
      sets?: number
      reps?: string
      rest?: string
      instructions?: string
      image?: string
      images?: string[]
      exercise?: {
        _id?: string
        id?: string
        name?: string
        sets?: number
        reps?: string
        rest?: string
        instructions?: string
        image?: string
        images?: string[]
      }
    }

    const nested = entry.exercise
    const images = Array.isArray(nested?.images)
      ? nested.images
      : Array.isArray(entry.images)
        ? entry.images
        : nested?.image || entry.image
          ? [String(nested?.image || entry.image)]
          : []

    return {
      id: entry.id || entry._id || nested?.id || nested?._id || String(index),
      exerciseRefId: resolveExerciseRefId(entry, nested),
      name: nested?.name || entry.name || "",
      sets: Number(entry.sets ?? nested?.sets ?? 0),
      reps: String(entry.reps ?? nested?.reps ?? ""),
      rest: String(entry.rest ?? nested?.rest ?? ""),
      instructions: String(entry.instructions ?? nested?.instructions ?? ""),
      images,
    }
  })
}

function EditRoutineForm({
  routine,
  onOpenChange,
  onUpdated,
}: {
  routine: EditRoutineDialogProps["routine"]
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}) {
  const [name, setName] = useState(() => routine.name || "")
  const [description, setDescription] = useState(() => routine.description || "")
  const [duration, setDuration] = useState(() => routine.duration || "")
  const [difficulty, setDifficulty] = useState<Routine["difficulty"]>(() => routine.difficulty || "beginner")
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(() =>
    String(routine.trainingDaysPerWeek || 5),
  )
  const [exercises, setExercises] = useState<ExerciseForm[]>(() =>
    normalizeExercisesForForm(routine.exercises),
  )
  const [loading, setLoading] = useState(false)

  const routineId = getDocumentId(routine) || routine._id || routine.id
  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: "",
        sets: 0,
        reps: "",
        rest: "",
        instructions: "",
        images: [],
      },
    ])
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  const updateExercise = (id: string, field: keyof ExerciseForm, value: string | number | string[]) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)))
  }

  const applySavedExercise = (
    rowId: string,
    saved: {
      id: string
      name: string
      sets: number
      reps: string
      rest: string
      instructions: string
      images: string[]
    } | null,
  ) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== rowId) return exercise
        if (!saved) {
          return { ...exercise, exerciseRefId: undefined }
        }
        return {
          ...exercise,
          exerciseRefId: saved.id,
          name: saved.name,
          sets: saved.sets,
          reps: saved.reps,
          rest: saved.rest,
          instructions: saved.instructions,
          images: saved.images,
        }
      }),
    )
  }

  const handleApiError = async (res: Response) => {
    let message = `Error ${res.status}: ${res.statusText}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
      else if (data?.message) message = data.message
    } catch {
      // ignorar si no hay JSON
    }
    alert(message)
  }

  const handleSave = async () => {
    if (!routineId) {
      alert("Error: la rutina no tiene un ID válido.")
      return
    }

    setLoading(true)
    try {
      const updatedRoutine = {
        name,
        description,
        duration,
        difficulty,
        trainingDaysPerWeek: Number(trainingDaysPerWeek),
        exercises: exercises.map((ex) => ({
          ...(ex.exerciseRefId ? { exercise: ex.exerciseRefId } : {}),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          instructions: ex.instructions,
          images: ex.images,
          image: ex.images[0] || "",
        })),
      }

      const res = await fetch(`/api/routines/${routineId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedRoutine),
      })

      if (!res.ok) {
        await handleApiError(res)
        return
      }

      alert("Rutina actualizada correctamente.")
      onOpenChange(false)
      onUpdated?.()
    } catch (err: unknown) {
      alert(`Error de red o ejecución: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoutine = async () => {
    if (!routineId) {
      alert("Error: la rutina no tiene un ID válido.")
      return
    }

    if (!confirm("¿Seguro que deseas eliminar esta rutina?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!res.ok) {
        await handleApiError(res)
        return
      }

      alert("Rutina eliminada correctamente.")
      onOpenChange(false)
      onUpdated?.()
    } catch (err: unknown) {
      alert(`Error de red o ejecución: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar Rutina</DialogTitle>
        <DialogDescription>Modifica la información de la rutina y sus ejercicios.</DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre de la Rutina</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Duración</Label>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Nivel de Dificultad</Label>
              <Select value={difficulty} onValueChange={(value: Routine["difficulty"]) => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Días de entrenamiento por semana</Label>
              <Select value={trainingDaysPerWeek} onValueChange={setTrainingDaysPerWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 días</SelectItem>
                  <SelectItem value="5">5 días</SelectItem>
                  <SelectItem value="6">6 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Ejercicios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExercise}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Ejercicio
                </Button>
              </div>

              {exercises.map((exercise, index) => (
                <Card key={exercise.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Ejercicio {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <SavedExerciseSelect
                      value={exercise.exerciseRefId}
                      onSelect={(saved) => applySavedExercise(exercise.id, saved)}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombre del Ejercicio</Label>
                        <Input
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <CloudinaryImageUpload
                          label="Imágenes del ejercicio"
                          value={exercise.images}
                          onChange={(images) => updateExercise(exercise.id, "images", images)}
                          folder="gympro/exercises"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-3">
                      <div className="space-y-2">
                        <Label>Series</Label>
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(exercise.id, "sets", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Repeticiones</Label>
                        <Input
                          value={exercise.reps}
                          onChange={(e) => updateExercise(exercise.id, "reps", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descanso</Label>
                        <Input
                          value={exercise.rest}
                          onChange={(e) => updateExercise(exercise.id, "rest", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Instrucciones</Label>
                      <Textarea
                        value={exercise.instructions}
                        onChange={(e) => updateExercise(exercise.id, "instructions", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDeleteRoutine} disabled={loading}>
            Eliminar Rutina
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Guardar Cambios
          </Button>
        </DialogFooter>
    </>
  )
}

export function EditRoutineDialog({ open, onOpenChange, routine, onUpdated }: EditRoutineDialogProps) {
  const routineId = getDocumentId(routine) || routine._id || routine.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        {open ? (
          <EditRoutineForm
            key={routineId}
            routine={routine}
            onOpenChange={onOpenChange}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
