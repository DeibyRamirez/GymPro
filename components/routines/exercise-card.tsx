import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Repeat } from "lucide-react"
import Image from "next/image"
import type { Exercise } from "@/lib/data"

interface ExerciseCardProps {
  exercise: Exercise
  index: number
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 bg-muted">
        <Image src={exercise.image || "/placeholder.svg"} alt={exercise.name} fill className="object-cover" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary text-primary-foreground font-bold">#{index + 1}</Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{exercise.instructions}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Repeat className="h-4 w-4" />
            <span className="font-medium">{exercise.sets} series</span>
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">{exercise.reps} reps</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{exercise.rest}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
