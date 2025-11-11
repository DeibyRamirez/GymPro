"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, TrendingUp, Dumbbell } from "lucide-react"
import type { Routine } from "@/lib/data"
import Image from "next/image"

interface ViewRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine: Routine
}

export function ViewRoutineDialog({ open, onOpenChange, routine }: ViewRoutineDialogProps) {
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "Principiante"
      case "intermediate":
        return "Intermedio"
      case "advanced":
        return "Avanzado"
      default:
        return difficulty
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{routine.name}</DialogTitle>
              <DialogDescription className="mt-2">{routine.description}</DialogDescription>
            </div>
            <Badge variant="secondary">{getDifficultyLabel(routine.difficulty)}</Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{routine.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{routine.exercises.length} ejercicios</span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {routine.exercises.map((exercise, index) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 relative rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={exercise.image || "/placeholder.svg"}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">
                            {index + 1}
                          </span>
                          {exercise.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{exercise.sets}</span>
                        <span className="text-muted-foreground">series</span>
                      </div>
                      <div className="text-muted-foreground">•</div>
                      <div>
                        <span className="font-semibold">{exercise.reps}</span>
                        <span className="text-muted-foreground"> reps</span>
                      </div>
                      <div className="text-muted-foreground">•</div>
                      <div>
                        <span className="font-semibold">{exercise.rest}</span>
                        <span className="text-muted-foreground"> descanso</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-pretty">{exercise.instructions}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
