"use client"

import { CloudinaryImageUpload } from "@/components/ui/cloudinary-image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type ExerciseFormValues = {
  name: string
  sets: string
  reps: string
  rest: string
  instructions: string
  images: string[]
  muscleGroup: string
  difficulty: "beginner" | "intermediate" | "advanced"
}

export const MUSCLE_GROUP_OPTIONS = [
  { value: "chest", label: "Pecho" },
  { value: "back", label: "Espalda" },
  { value: "shoulders", label: "Hombros" },
  { value: "arms", label: "Brazos" },
  { value: "legs", label: "Piernas" },
  { value: "core", label: "Core" },
  { value: "glutes", label: "Glúteos" },
  { value: "cardio", label: "Cardio" },
] as const

export const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
] as const

export function emptyExerciseForm(): ExerciseFormValues {
  return {
    name: "",
    sets: "",
    reps: "",
    rest: "",
    instructions: "",
    images: [],
    muscleGroup: "legs",
    difficulty: "beginner",
  }
}

interface ExerciseFormFieldsProps {
  values: ExerciseFormValues
  onChange: (field: keyof ExerciseFormValues, value: string | string[]) => void
}

export function ExerciseFormFields({ values, onChange }: ExerciseFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exercise-name">Nombre</Label>
        <Input
          id="exercise-name"
          placeholder="Ej: Sentadilla con barra"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Grupo muscular</Label>
          <Select value={values.muscleGroup} onValueChange={(value) => onChange("muscleGroup", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_GROUP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dificultad</Label>
          <Select
            value={values.difficulty}
            onValueChange={(value) => onChange("difficulty", value as ExerciseFormValues["difficulty"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <div className="space-y-2">
          <Label>Series (referencia)</Label>
          <Input
            placeholder="4"
            value={values.sets}
            onChange={(e) => onChange("sets", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Repeticiones (referencia)</Label>
          <Input
            placeholder="8-12"
            value={values.reps}
            onChange={(e) => onChange("reps", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Descanso (referencia)</Label>
          <Input
            placeholder="90s"
            value={values.rest}
            onChange={(e) => onChange("rest", e.target.value)}
          />
        </div>
      </div>

      <CloudinaryImageUpload
        label="Imágenes del ejercicio"
        value={values.images}
        onChange={(images) => onChange("images", images)}
        folder="gympro/exercises"
      />

      <div className="space-y-2">
        <Label>Instrucciones</Label>
        <Textarea
          placeholder="Describe la técnica y puntos clave..."
          value={values.instructions}
          onChange={(e) => onChange("instructions", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  )
}

export function buildExercisePayload(values: ExerciseFormValues) {
  return {
    name: values.name.trim(),
    sets: values.sets.trim(),
    reps: values.reps.trim(),
    rest: values.rest.trim(),
    instructions: values.instructions.trim(),
    images: values.images,
    image: values.images[0] || "",
    muscleGroups: [values.muscleGroup],
    equipment: [],
    difficulty: values.difficulty,
  }
}

export function validateExerciseForm(values: ExerciseFormValues): string | null {
  if (!values.name.trim()) return "El nombre es obligatorio"
  if (!values.sets.trim()) return "Indica las series de referencia"
  if (!values.reps.trim()) return "Indica las repeticiones de referencia"
  if (!values.rest.trim()) return "Indica el descanso de referencia"
  if (!values.instructions.trim()) return "Las instrucciones son obligatorias"
  return null
}
