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
  emptyExerciseForm,
  ExerciseFormFields,
  validateExerciseForm,
} from "@/components/trainer/exercise-form-fields"

interface CreateExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateExerciseDialog({ open, onOpenChange, onSuccess }: CreateExerciseDialogProps) {
  const [values, setValues] = useState(emptyExerciseForm)
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof typeof values, value: string | string[]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleCreate = async () => {
    const validationError = validateExerciseForm(values)
    if (validationError) {
      alert(validationError)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildExercisePayload(values)),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Error al crear el ejercicio")
      }

      setValues(emptyExerciseForm())
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setValues(emptyExerciseForm())
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
          <DialogDescription>
            Guarda el ejercicio en tu biblioteca para reutilizarlo en rutinas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <ExerciseFormFields values={values} onChange={updateField} />
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Guardando..." : "Guardar ejercicio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
