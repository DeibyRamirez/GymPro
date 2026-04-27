"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AssignRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onAssign: (payload: { routineId: string; durationWeeks: number; weeklySchedule: Array<{ dayOfWeek: number; isRestDay: boolean; title?: string }> }) => Promise<void> | void
}

type RoutineOption = {
  _id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  exercises: unknown[]
}

export function AssignRoutineDialog({ open, onOpenChange, clientName, onAssign }: AssignRoutineDialogProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<string>("")
  const [routines, setRoutines] = useState<RoutineOption[]>([])
  const [durationWeeks, setDurationWeeks] = useState("4")
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5])

  useEffect(() => {
    if (!open) return

    let active = true

    const loadRoutines = async () => {
      try {
        const res = await fetch('/api/routines?limit=100', { credentials: 'include' })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.error || 'No se pudieron cargar las rutinas')
        }

        if (active) {
          setRoutines(data?.routines || [])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudieron cargar las rutinas'
        toast({
          title: 'Error al cargar rutinas',
          description: message,
          variant: 'destructive',
        })
        if (active) {
          setRoutines([])
        }
      }
    }

    loadRoutines()

    return () => {
      active = false
    }
  }, [open])

  const handleAssign = async () => {
    if (selectedRoutine) {
      const weeklySchedule = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        isRestDay: !activeDays.includes(dayOfWeek),
        title: activeDays.includes(dayOfWeek) ? "Entrenamiento" : "Descanso Activo",
      }))

      try {
        await Promise.resolve(
          onAssign({
            routineId: selectedRoutine,
            durationWeeks: Number(durationWeeks) || 4,
            weeklySchedule,
          })
        )
        onOpenChange(false)
        setSelectedRoutine("")
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo asignar la rutina'
        toast({
          title: 'Error al asignar',
          description: message,
          variant: 'destructive',
        })
      }
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Rutina a {clientName}</DialogTitle>
          <DialogDescription>Selecciona una rutina de entrenamiento para asignar al cliente</DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedRoutine} onValueChange={setSelectedRoutine} className="space-y-3">
          {routines.map((routine) => (
            <div
              key={routine._id}
              className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/5 cursor-pointer"
            >
              <RadioGroupItem value={routine._id} id={routine._id} className="mt-1" />
              <Label htmlFor={routine._id} className="flex-1 cursor-pointer">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{routine.name}</h4>
                    <Badge variant="secondary" className={difficultyColors[routine.difficulty]}>
                      {difficultyLabels[routine.difficulty]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{routine.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {routine.duration}
                    </span>
                    <span>{routine.exercises.length} ejercicios</span>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="space-y-3 border rounded-lg p-4">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base">Configuración del plan</Label>
            <Badge variant="secondary">Microciclo</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Duración del plan (semanas)</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)}>
                <option value="4">4 semanas</option>
                <option value="6">6 semanas</option>
                <option value="8">8 semanas</option>
                <option value="12">12 semanas</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Días activos</Label>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { day: 0, label: 'D' },
                  { day: 1, label: 'L' },
                  { day: 2, label: 'M' },
                  { day: 3, label: 'X' },
                  { day: 4, label: 'J' },
                  { day: 5, label: 'V' },
                  { day: 6, label: 'S' },
                ].map(({ day, label }) => {
                  const active = activeDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`flex h-10 items-center justify-center rounded-md border text-sm ${active ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                      onClick={() => setActiveDays((current) => active ? current.filter((d) => d !== day) : [...current, day].sort())}
                    >
                      {active && <Check className="mr-1 h-3 w-3" />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!selectedRoutine}>
            Asignar Rutina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
