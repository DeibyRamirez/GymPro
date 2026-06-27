"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

export type SavedExerciseOption = {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  images: string[]
}

interface SavedExerciseSelectProps {
  value?: string
  onSelect: (exercise: SavedExerciseOption | null) => void
  disabled?: boolean
}

export function SavedExerciseSelect({ value, onSelect, disabled }: SavedExerciseSelectProps) {
  const [options, setOptions] = useState<SavedExerciseOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadExercises() {
      setLoading(true)
      try {
        const response = await fetch("/api/exercises?limit=100", { credentials: "include" })
        if (!response.ok || !active) return

        const data = await response.json()
        const nextOptions = (data.exercises || []).map(
          (item: {
            id?: string
            _id?: string
            name: string
            sets: number
            reps: string
            rest: string
            instructions: string
            image?: string
            images?: string[]
          }) => ({
            id: item.id || item._id || "",
            name: item.name,
            sets: item.sets,
            reps: item.reps,
            rest: item.rest,
            instructions: item.instructions,
            images: item.images?.length
              ? item.images
              : item.image
                ? [item.image]
                : [],
          }),
        )

        setOptions(nextOptions.filter((item: SavedExerciseOption) => item.id))
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadExercises()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-2">
      <Label>Ejercicio guardado</Label>
      <Select
        value={value || "__new__"}
        onValueChange={(selected) => {
          if (selected === "__new__") {
            onSelect(null)
            return
          }
          onSelect(options.find((option) => option.id === selected) || null)
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Cargando biblioteca..." : "Seleccionar ejercicio"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__new__">Crear ejercicio nuevo</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
