"use client"

import { useState, useEffect } from "react"
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
import { Plus, Trash2, ImageIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Routine, Exercise } from "@/lib/data"

interface EditRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine: Routine
  onUpdated?: () => void
}

interface ExerciseForm extends Exercise {
  sets: number
  reps: string
  rest: string
  instructions: string
  image: string
}

export function EditRoutineDialog({ open, onOpenChange, routine, onUpdated }: EditRoutineDialogProps) {
  const [name, setName] = useState(routine.name)
  const [description, setDescription] = useState(routine.description)
  const [duration, setDuration] = useState(routine.duration)
  const [difficulty, setDifficulty] = useState(routine.difficulty)
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(String((routine as Routine & { trainingDaysPerWeek?: number }).trainingDaysPerWeek || 5))
  const [exercises, setExercises] = useState<ExerciseForm[]>(routine.exercises)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log("📦 Rutina recibida en EditRoutineDialog:", routine);
  }, [routine]);


  // ➕ Agregar un nuevo ejercicio
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
        image: "",
      },
    ])
  }

  // 🗑️ Eliminar un ejercicio
  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  // ✏️ Actualizar campos del ejercicio
  const updateExercise = (id: string, field: keyof ExerciseForm, value: string | number) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)))
  }

  // ⚠️ Manejo de errores detallado
  const handleApiError = async (res: Response) => {
    let message = `Error ${res.status}: ${res.statusText}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
      else if (data?.message) message = data.message
    } catch {
      // ignorar si no hay JSON
    }
    console.error(`❌ Respuesta del servidor (${res.status}):`, message)
    alert(message)
  }

  // ✅ Guardar cambios en la rutina
  const handleSave = async () => {
    if (!routine?._id) {
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
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          instructions: ex.instructions,
          image: ex.image,
        })),
      }

      console.log("🧠 ID de la rutina que se intenta actualizar:", routine._id)

      const res = await fetch(`/api/routines/${routine._id}`, {
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

      const data = await res.json()
      console.log("✅ Rutina actualizada:", data)
      alert("Rutina actualizada correctamente.")
      onOpenChange(false)
      onUpdated?.()
    } catch (err: unknown) {
      console.error("❌ Error de red o ejecución:", err)
      alert(`Error de red o ejecución: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // ❌ Eliminar rutina
  const handleDeleteRoutine = async () => {
    if (!routine?._id) {
      alert("Error: la rutina no tiene un ID válido.")
      return
    }

    if (!confirm("¿Seguro que deseas eliminar esta rutina?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/routines/${routine._id}`, {
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

      console.log("🗑️ Rutina eliminada correctamente")
      alert("Rutina eliminada correctamente.")
      onOpenChange(false)
      onUpdated?.()
    } catch (err: unknown) {
      console.error("❌ Error de red o ejecución:", err)
      alert(`Error de red o ejecución: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Rutina</DialogTitle>
          <DialogDescription>Modifica la información de la rutina y sus ejercicios.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información básica */}
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
              <Select value={difficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setDifficulty(value)}>
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

            {/* Ejercicios */}
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

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombre del Ejercicio</Label>
                        <Input
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL de Imagen</Label>
                        <div className="flex gap-2">
                          <Input
                            value={exercise.image}
                            onChange={(e) => updateExercise(exercise.id, "image", e.target.value)}
                          />
                          <Button type="button" variant="outline" size="icon">
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
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
      </DialogContent>
    </Dialog>
  )
}
