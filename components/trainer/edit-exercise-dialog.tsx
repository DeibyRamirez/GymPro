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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  buildExercisePayload,
  ExerciseFormFields,
  type ExerciseFormValues,
  validateExerciseForm,
} from "@/components/trainer/exercise-form-fields"
import { getDocumentId } from "@/lib/assignment/ref-id"

export type SavedExercise = {
  _id?: string
  id?: string
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  image?: string
  images?: string[]
  muscleGroups?: string[]
  difficulty?: ExerciseFormValues["difficulty"]
}

function toFormValues(exercise: SavedExercise): ExerciseFormValues {
  const images = exercise.images?.length
    ? exercise.images
    : exercise.image
      ? [exercise.image]
      : []

  return {
    name: exercise.name || "",
    sets: String(exercise.sets ?? ""),
    reps: exercise.reps || "",
    rest: exercise.rest || "",
    instructions: exercise.instructions || "",
    images,
    muscleGroup: exercise.muscleGroups?.[0] || "legs",
    difficulty: exercise.difficulty || "beginner",
  }
}

interface EditExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: SavedExercise
  onUpdated?: () => void
}

function EditExerciseForm({
  exercise,
  onOpenChange,
  onUpdated,
}: {
  exercise: SavedExercise
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}) {
  const exerciseId = getDocumentId(exercise) || exercise._id || exercise.id
  const [values, setValues] = useState(() => toFormValues(exercise))
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof ExerciseFormValues, value: string | string[]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async () => {
    if (!exerciseId) {
      alert("El ejercicio no tiene un ID válido.")
      return
    }

    const validationError = validateExerciseForm(values)
    if (validationError) {
      alert(validationError)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildExercisePayload(values)),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al actualizar el ejercicio")
      }

      onOpenChange(false)
      onUpdated?.()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!exerciseId) {
      alert("El ejercicio no tiene un ID válido.")
      return
    }

    if (!confirm("¿Eliminar este ejercicio de tu biblioteca? Las rutinas que lo usen pueden verse afectadas.")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al eliminar el ejercicio")
      }

      onOpenChange(false)
      onUpdated?.()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar ejercicio</DialogTitle>
        <DialogDescription>Actualiza los datos de tu biblioteca personal.</DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] pr-4">
        <ExerciseFormFields values={values} onChange={updateField} />
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          Eliminar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function EditExerciseDialog({ open, onOpenChange, exercise, onUpdated }: EditExerciseDialogProps) {
  const exerciseId = getDocumentId(exercise) || exercise._id || exercise.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        {open ? (
          <EditExerciseForm
            key={exerciseId}
            exercise={exercise}
            onOpenChange={onOpenChange}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
