"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Clock, ChevronRight } from "lucide-react"
import type { Routine } from "@/lib/data"

interface AssignedRoutineCardProps {
  routine: Routine
  onViewDetails: () => void
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

export function AssignedRoutineCard({ routine, onViewDetails }: AssignedRoutineCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Rutina Actual
          </CardTitle>
          <Badge variant="secondary" className={difficultyColors[routine.difficulty]}>
            {difficultyLabels[routine.difficulty]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">{routine.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{routine.duration}</span>
          </div>
          <div>{routine.exercises.length} ejercicios</div>
        </div>

        <Button onClick={onViewDetails} className="w-full">
          Ver Rutina Completa
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
