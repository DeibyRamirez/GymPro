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
import { Plus, Trash2, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreateRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ExerciseForm {
  id: string
  name: string
  sets: string
  reps: string
  rest: string
  instructions: string
}

export function CreateRoutineDialog({ open, onOpenChange, onSuccess }: CreateRoutineDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<string>("beginner")
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    {
      id: "1",
      name: "",
      sets: "",
      reps: "",
      rest: "",
      instructions: "",
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: "",
        sets: "",
        reps: "",
        rest: "",
        instructions: "",
      },
    ])
  }

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((ex) => ex.id !== id))
    }
  }

  const updateExercise = (id: string, field: keyof ExerciseForm, value: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)))
  }

  const handleCreate = async () => {
    setError("")
    
    // Validaciones
    if (!name || !description || !duration) {
      setError("Por favor completa todos los campos básicos")
      return
    }

    if (exercises.length === 0 || exercises.some(ex => !ex.name || !ex.sets || !ex.reps || !ex.rest)) {
      setError("Por favor completa todos los campos de los ejercicios")
      return
    }

    setLoading(true)

    try {
      // Primero crear los ejercicios
      const createdExercises = []
      
      for (const exercise of exercises) {
        const exerciseResponse = await fetch("/api/exercises", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: exercise.name,
            sets: parseInt(exercise.sets),
            reps: exercise.reps,
            rest: exercise.rest,
            instructions: exercise.instructions || "Realizar el ejercicio con buena forma",
            muscleGroups: ["core"], // Por defecto, el usuario puede editar después
            equipment: ["bodyweight"],
            difficulty: difficulty,
          }),
        })

        if (!exerciseResponse.ok) {
          const errorData = await exerciseResponse.json()
          throw new Error(errorData.error || "Error al crear ejercicio")
        }

        const exerciseData = await exerciseResponse.json()
        createdExercises.push({
          exercise: exerciseData.exercise.id,
          sets: parseInt(exercise.sets),
          reps: exercise.reps,
          rest: exercise.rest,
          order: createdExercises.length + 1,
        })
      }

      // Luego crear la rutina
      const routineResponse = await fetch("/api/routines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          duration,
          difficulty,
          exercises: createdExercises,
          tags: [],
        }),
      })

      if (!routineResponse.ok) {
        const errorData = await routineResponse.json()
        throw new Error(errorData.error || "Error al crear rutina")
      }

      // Reset form
      setName("")
      setDescription("")
      setDuration("")
      setDifficulty("beginner")
      setExercises([
        {
          id: "1",
          name: "",
          sets: "",
          reps: "",
          rest: "",
          instructions: "",
        },
      ])

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la rutina")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Mi Rutina</DialogTitle>
          <DialogDescription>Crea tu propia rutina de ejercicios personalizada</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Rutina</Label>
                <Input
                  id="name"
                  placeholder="Ej: Mi Rutina de Fuerza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Input
                  id="duration"
                  placeholder="Ej: 60 min"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe el objetivo y características de tu rutina..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Nivel de Dificultad</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
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
                  className="gap-2"
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
                      {exercises.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeExercise(exercise.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Nombre del Ejercicio</Label>
                      <Input
                        placeholder="Ej: Sentadillas"
                        value={exercise.name}
                        onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-4 grid-cols-3">
                      <div className="space-y-2">
                        <Label>Series</Label>
                        <Input
                          type="number"
                          placeholder="4"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(exercise.id, "sets", e.target.value)}
                          min={1}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Repeticiones</Label>
                        <Input
                          placeholder="8-12"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(exercise.id, "reps", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descanso</Label>
                        <Input
                          placeholder="90s"
                          value={exercise.rest}
                          onChange={(e) => updateExercise(exercise.id, "rest", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Instrucciones (opcional)</Label>
                      <Textarea
                        placeholder="Describe cómo realizar el ejercicio..."
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Rutina"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

