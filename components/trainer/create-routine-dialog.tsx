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
import { Plus, Trash2, ImageIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreateRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExerciseForm {
  id: string
  name: string
  sets: string
  reps: string
  rest: string
  instructions: string
  image: string
}

export function CreateRoutineDialog({ open, onOpenChange }: CreateRoutineDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<string>("intermediate")
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    {
      id: "1",
      name: "",
      sets: "",
      reps: "",
      rest: "",
      instructions: "",
      image: "",
    },
  ])

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
        image: "",
      },
    ])
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  const updateExercise = (id: string, field: keyof ExerciseForm, value: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)))
  }

  const handleCreate = () => {
    console.log("Crear rutina:", { name, description, duration, difficulty, exercises })
    onOpenChange(false)
    // Reset form
    setName("")
    setDescription("")
    setDuration("")
    setDifficulty("intermediate")
    setExercises([
      {
        id: "1",
        name: "",
        sets: "",
        reps: "",
        rest: "",
        instructions: "",
        image: "",
      },
    ])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Rutina</DialogTitle>
          <DialogDescription>Completa la información de la rutina y agrega los ejercicios</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Rutina</Label>
                <Input
                  id="name"
                  placeholder="Ej: Fuerza Total"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Input
                  id="duration"
                  placeholder="Ej: 60 min"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe el objetivo y características de la rutina..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
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
                      {exercises.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(exercise.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombre del Ejercicio</Label>
                        <Input
                          placeholder="Ej: Sentadillas"
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, "name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL de Imagen</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="/ruta-imagen.jpg"
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
                          placeholder="4"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(exercise.id, "sets", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Repeticiones</Label>
                        <Input
                          placeholder="8-12"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(exercise.id, "reps", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Descanso</Label>
                        <Input
                          placeholder="90s"
                          value={exercise.rest}
                          onChange={(e) => updateExercise(exercise.id, "rest", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Instrucciones</Label>
                      <Textarea
                        placeholder="Describe cómo realizar el ejercicio correctamente..."
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
          <Button onClick={handleCreate}>Crear Rutina</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
