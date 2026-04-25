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
import { Calendar } from "lucide-react"

interface AssignRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onAssign: (routineId: string) => void
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

  useEffect(() => {
    if (!open) return

    fetch('/api/routines?limit=100', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setRoutines(data.routines || []))
  }, [open])

  const handleAssign = () => {
    if (selectedRoutine) {
      onAssign(selectedRoutine)
      onOpenChange(false)
      setSelectedRoutine("")
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
